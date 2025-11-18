// outboxWl/runtime/syncRuntimeListener.spec.ts

import { AnyAction, Middleware } from "@reduxjs/toolkit";
import {
    SyncEventsGateway,
    CursorUnknownSyncError,
} from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import { syncRuntimeListenerFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/syncRuntimeListenerFactory";
import {
    replayRequested,
    syncDecideRequested,
    syncEventsReceived,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { createMemorySyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {RecordingGateway} from "@/app/adapters/secondary/gateways/fake/fakeSyncRecordEventGateway";

// ---- helpers de test ----

const captureActions =
    (bag: AnyAction[]): Middleware =>
        () =>
            (next) =>
                (action) => {
                    bag.push(action as AnyAction);
                    return next(action);
                };

const waitFor = async (assertion: () => void, timeoutMs = 500) => {
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            assertion();
            return;
        } catch (error) {
            if (Date.now() - start > timeoutMs) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
    }
};
// ---- helper pour créer un store avec initReduxStoreWl ----

const makeStore = (opts: {
    gateway: SyncEventsGateway;
    metaStorage: ReturnType<typeof createMemorySyncMetaStorage>;
    actionsBag?: AnyAction[];
    nowMs?: () => number;
}): ReduxStoreWl => {
    const { gateway, metaStorage, actionsBag, nowMs } = opts;

    const listener = syncRuntimeListenerFactory({
        eventsGateway: gateway,
        metaStorage,
        // on injecte un sessionStamp constant pour ne pas dépendre du shape du state
        getSessionStamp: () => "user:1:123",
        nowMs,
    });

    return initReduxStoreWl({
        dependencies: {
            gateways: {},
            helpers: {},
        },
        listeners: [listener.middleware],
        extraMiddlewares: actionsBag ? [captureActions(actionsBag)] : [],
    });
};

// ---- Tests ----

describe("sync runtime listener (outboxWl)", () => {
    it("runs delta once after short idle", async () => {
        const now = Date.now();
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        await metaStorage.setCursor("cursor_prev");
        await metaStorage.setSessionId("user:1:123");
        await metaStorage.updateLastActiveAt(now - 2 * 60_000); // 2 minutes d'inactivité

        const gateway = new RecordingGateway();
        const actions: AnyAction[] = [];

        const store = makeStore({
            gateway,
            metaStorage,
            actionsBag: actions,
            nowMs: () => now,
        });

        store.dispatch(syncDecideRequested());
        store.dispatch(syncDecideRequested());

        await waitFor(() => {
            expect(gateway.deltaCalls).toBe(1);
            expect(gateway.fullCalls).toBe(0);
        });

        expect(
            actions.filter((action) => action.type === syncDecideRequested.type),
        ).toHaveLength(2);
    });

    it("falls back to full when cursor unknown", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        await metaStorage.setCursor("stale");
        await metaStorage.setSessionId("user:1:123");
        await metaStorage.updateLastActiveAt(Date.now() - 15 * 60_000); // 15 min

        const gateway = new RecordingGateway({
            deltaError: new CursorUnknownSyncError("cursor"),
        });

        const store = makeStore({
            gateway,
            metaStorage,
        });

        store.dispatch(syncDecideRequested());

        await waitFor(() => {
            expect(gateway.deltaCalls).toBe(1);
            expect(gateway.fullCalls).toBe(1);
            expect(metaStorage.getSnapshot().cursor).toBe("cursor_full");
        });
    });

    it("forces full after long inactivity", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        await metaStorage.setCursor("cursor_prev");
        await metaStorage.setSessionId("user:1:123");
        await metaStorage.updateLastActiveAt(
            Date.now() - 2 * 60 * 60_000, // 2h d'inactivité
        );

        const gateway = new RecordingGateway();

        const store = makeStore({
            gateway,
            metaStorage,
        });

        store.dispatch(syncDecideRequested());

        await waitFor(() => {
            expect(gateway.fullCalls).toBe(1);
            expect(gateway.deltaCalls).toBe(0);
        });
    });

    it("dispatches syncEventsReceived on replay when gateway returns events", async () => {
        const event: SyncEvent = {
            id: "evt-1",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-demo",
                targetId: "cafe_demo",
                server: {
                    count: 1,
                    me: true,
                    version: 1,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const actions: AnyAction[] = [];
        const gateway = new RecordingGateway();
        gateway.eventsForReplay = [event];

        const store = makeStore({
            gateway,
            metaStorage,
            actionsBag: actions,
        });

        store.dispatch(replayRequested());

        await waitFor(() => {
            const received = actions.filter(
                (a) => a.type === syncEventsReceived.type,
            );
            expect(received).toHaveLength(1);
            expect(received[0].payload).toEqual([event]);
        });
    });
});
