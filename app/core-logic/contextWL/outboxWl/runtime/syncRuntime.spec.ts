import { createSyncRuntime } from "@/app/core-logic/contextWL/outboxWl/runtime/syncRuntime";
import { MemorySyncMetaStorage, createDefaultSyncMeta } from "@/app/core-logic/contextWL/outboxWl/runtime/syncMetaStorage";
import { SyncEventsGateway, CursorUnknownSyncError } from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/runtime/syncEvents";
import { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {parseToISODate} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

const buildStore = (sessionId = "user:1") => {
    const state = {
        aState: {
            session: {
                userId: sessionId.split(":")[0],
                provider: "demo",
                scopes: [],
                establishedAt: Date.now(),
                tokens: {
                    expiresAt: Date.now() + 60_000,
                    issuedAt: Date.now(),
                },
            },
        },
    } as any;
    const dispatched: any[] = [];
    const store = {
        getState: () => state,
        dispatch: (action: any) => {
            dispatched.push(action);
            return action;
        },
    } as unknown as ReduxStoreWl;
    return { store, dispatched };
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

describe("syncRuntime decideAndSync", () => {
    it("runs delta once after short idle", async () => {
        const now = Date.now();
        const storage = new MemorySyncMetaStorage();
        await storage.save({
            cursor: "cursor_prev",
            lastActiveAt: new Date(now - 2 * 60_000).toISOString(),
            sessionId: "user:1",
            appliedEventIds: [],
        });
        const { store } = buildStore("user:1");
        const gateway = new RecordingGateway();
        const runtime = createSyncRuntime({
            store,
            eventsGateway: gateway,
            metaStorage: storage,
            nowMs: () => now,
            nowIso: () => new Date(now).toISOString(),
            getSessionStamp: () => "user:1",
        });

        await runtime.decideAndSync();
        await runtime.decideAndSync();

        expect(gateway.deltaCalls).toBe(1);
        expect(gateway.fullCalls).toBe(0);
    });

    it("falls back to full when cursor unknown", async () => {
        const storage = new MemorySyncMetaStorage();
        await storage.save({
            cursor: "stale",
            lastActiveAt: new Date(Date.now() - 15 * 60_000).toISOString(),
            sessionId: "user:1",
            appliedEventIds: [],
        });
        const { store } = buildStore("user:1");
        const gateway = new RecordingGateway({ deltaError: new CursorUnknownSyncError("cursor") });
        const runtime = createSyncRuntime({
            store,
            eventsGateway: gateway,
            metaStorage: storage,
            nowMs: () => Date.now(),
            getSessionStamp: () => "user:1",
        });

        await runtime.decideAndSync();
        expect(gateway.deltaCalls).toBe(1);
        expect(gateway.fullCalls).toBe(1);
        const snapshot = await storage.load();
        expect(snapshot?.cursor).toBe("cursor_full");
    });

    it("forces full after long inactivity", async () => {
        const storage = new MemorySyncMetaStorage();
        await storage.save({
            cursor: "cursor_prev",
            lastActiveAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
            sessionId: "user:1",
            appliedEventIds: [],
        });
        const { store } = buildStore("user:1");
        const gateway = new RecordingGateway();
        const runtime = createSyncRuntime({
            store,
            eventsGateway: gateway,
            metaStorage: storage,
            nowMs: () => Date.now(),
            getSessionStamp: () => "user:1",
        });

        await runtime.decideAndSync();
        expect(gateway.fullCalls).toBe(1);
        expect(gateway.deltaCalls).toBe(0);
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
                    updatedAt: new Date().toISOString(),
                },
            },
        };
        const storage = new MemorySyncMetaStorage();
        await storage.save(createDefaultSyncMeta());
        const { store, dispatched } = buildStore("user:1");
        const gatewayA: SyncEventsGateway = {
            replayLocal: async () => ({ events: [event] }),
            syncDelta: async () => ({ events: [], cursor: null, sessionId: "remote" }),
            syncFull: async () => ({ events: [], cursor: null, sessionId: "remote" }),
        };
        const runtimeA = createSyncRuntime({
            store,
            eventsGateway: gatewayA,
            metaStorage: storage,
            nowMs: () => Date.now(),
            getSessionStamp: () => "user:1",
        });
        await runtimeA.replayLocal();
        expect(dispatched.length).toBe(1);

        const gatewayB: SyncEventsGateway = {
            replayLocal: async () => ({ events: [event] }),
            syncDelta: async () => ({ events: [], cursor: null, sessionId: "remote" }),
            syncFull: async () => ({ events: [], cursor: null, sessionId: "remote" }),
        };
        const runtimeB = createSyncRuntime({
            store,
            eventsGateway: gatewayB,
            metaStorage: storage,
            nowMs: () => Date.now(),
            getSessionStamp: () => "user:1",
        });
        await runtimeB.replayLocal();
        expect(dispatched.length).toBe(1);
    });
});
