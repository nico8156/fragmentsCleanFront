import { configureStore, Middleware, AnyAction } from "@reduxjs/toolkit";
import { SyncEventsGateway, CursorUnknownSyncError } from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import { syncRuntimeListenerFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/syncRuntimeListenerFactory";
import {
    replayRequested,
    syncDecideRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { createMemorySyncMetaStorage } from "@/app/core-logic/contextWL/outboxWl/runtime/syncMetaStorage";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

const buildState = (sessionStamp = "user:1") => {
    const [userId, issuedAtRaw] = sessionStamp.split(":");
    const issuedAt = Number(issuedAtRaw ?? Date.now());
    return {
        aState: {
            session: {
                userId,
                provider: "demo",
                scopes: [],
                establishedAt: issuedAt,
                tokens: {
                    expiresAt: issuedAt + 60_000,
                    issuedAt,
                },
            },
        },
    } as any;
};

const getSessionStampFromState = (state: ReturnType<typeof buildState>) => {
    return `${state.aState.session.userId}:${state.aState.session.tokens?.issuedAt ?? "0"}`;
};

const captureActions = (bag: AnyAction[]): Middleware => () => (next) => (action) => {
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

class RecordingGateway implements SyncEventsGateway {
    deltaCalls = 0;
    fullCalls = 0;
    replayCalls = 0;
    constructor(private readonly options: { deltaError?: Error } = {}) {}
    async replayLocal() {
        this.replayCalls += 1;
        return { events: [] };
    }
    async syncDelta() {
        this.deltaCalls += 1;
        if (this.options.deltaError) {
            throw this.options.deltaError;
        }
        return { events: [], cursor: "cursor_delta", sessionId: "remote" };
    }
    async syncFull() {
        this.fullCalls += 1;
        return { events: [], cursor: "cursor_full", sessionId: "remote" };
    }
}

describe("sync runtime listener", () => {
    it("runs delta once after short idle", async () => {
        const now = Date.now();
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();
        const baseState = buildState("user:1");
        await metaStorage.setCursor("cursor_prev");
        await metaStorage.setSessionId(getSessionStampFromState(baseState));
        await metaStorage.updateLastActiveAt(now - 2 * 60_000);
        const gateway = new RecordingGateway();
        const actions: AnyAction[] = [];
        const listener = syncRuntimeListenerFactory({
            eventsGateway: gateway,
            metaStorage,
            nowMs: () => now,
        });
        const store = configureStore({
            reducer: (state = baseState) => state,
            middleware: (getDefault) =>
                getDefault({ serializableCheck: false }).prepend(listener.middleware, captureActions(actions)),
        });

        store.dispatch(syncDecideRequested());
        store.dispatch(syncDecideRequested());
        await waitFor(() => {
            expect(gateway.deltaCalls).toBe(1);
            expect(gateway.fullCalls).toBe(0);
        });
        expect(actions.filter((action) => action.type === syncDecideRequested.type)).toHaveLength(2);
    });

    it("falls back to full when cursor unknown", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();
        const baseState = buildState("user:1");
        await metaStorage.setCursor("stale");
        await metaStorage.setSessionId(getSessionStampFromState(baseState));
        await metaStorage.updateLastActiveAt(Date.now() - 15 * 60_000);
        const gateway = new RecordingGateway({ deltaError: new CursorUnknownSyncError("cursor") });
        const listener = syncRuntimeListenerFactory({
            eventsGateway: gateway,
            metaStorage,
        });
        const store = configureStore({
            reducer: (state = baseState) => state,
            middleware: (getDefault) => getDefault({ serializableCheck: false }).prepend(listener.middleware),
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
        const baseState = buildState("user:1");
        await metaStorage.setCursor("cursor_prev");
        await metaStorage.setSessionId(getSessionStampFromState(baseState));
        await metaStorage.updateLastActiveAt(Date.now() - 2 * 60 * 60_000);
        const gateway = new RecordingGateway();
        const listener = syncRuntimeListenerFactory({
            eventsGateway: gateway,
            metaStorage,
        });
        const store = configureStore({
            reducer: (state = baseState) => state,
            middleware: (getDefault) => getDefault({ serializableCheck: false }).prepend(listener.middleware),
        });

        store.dispatch(syncDecideRequested());
        await waitFor(() => {
            expect(gateway.fullCalls).toBe(1);
            expect(gateway.deltaCalls).toBe(0);
        });
    });

    it("does not re-apply events already stored", async () => {
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
        const baseState = buildState("user:1");
        const gateway: SyncEventsGateway = {
            replayLocal: async () => ({ events: [event] }),
            syncDelta: async () => ({ events: [], cursor: null, sessionId: "remote" }),
            syncFull: async () => ({ events: [], cursor: null, sessionId: "remote" }),
        };
        const listener = syncRuntimeListenerFactory({
            eventsGateway: gateway,
            metaStorage,
        });
        const store = configureStore({
            reducer: (state = baseState) => state,
            middleware: (getDefault) =>
                getDefault({ serializableCheck: false }).prepend(listener.middleware, captureActions(actions)),
        });

        store.dispatch(replayRequested());
        await waitFor(() => {
            expect(actions.filter((action) => action.type === "SERVER/LIKE/ADDED_ACK")).toHaveLength(1);
        });

        store.dispatch(replayRequested());
        await waitFor(() => {
            expect(actions.filter((action) => action.type === "SERVER/LIKE/ADDED_ACK")).toHaveLength(1);
        });
    });
});
