import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { createActionsRecorder } from "@/app/store/middleware/actionRecorder";

import { syncEventsListenerFactory } from "@/app/core-logic/contextWL/outboxWl/sync/syncEventsListenerFactory";
import { syncEventsReceived } from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import { createMemorySyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

import {
    onLikeAddedAck,
} from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import {
    onCommentCreatedAck,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

const makeStore = (
    metaStorage: ReturnType<typeof createMemorySyncMetaStorage>,
    rec: ReturnType<typeof createActionsRecorder>,
): ReduxStoreWl =>
    initReduxStoreWl({
        dependencies: {
            gateways: {},
            helpers: {},
        },
        listeners: [syncEventsListenerFactory({ metaStorage })],
        extraMiddlewares: [rec.middleware],
    });

describe("syncEventsListenerFactory", () => {
    it("applies events and records their IDs", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const likeEvent: SyncEvent = {
            id: "evt-like-1",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-like-1",
                targetId: "cafe_A",
                server: {
                    count: 1,
                    me: true,
                    version: 1,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        const commentEvent: SyncEvent = {
            id: "evt-comment-1",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "comment.createdAck",
            payload: {
                commandId: "cmd-comment-1",
                targetId: "cafe_A",
                commentId: "cmt_001",
                body: "hello",
                version: 1,
                createdAt: parseToISODate(new Date().toISOString()),
            } as any,
        };

        store.dispatch(syncEventsReceived([likeEvent, commentEvent]));
        await flush();

        const types = rec.getTypes();

        expect(types).toEqual(
            expect.arrayContaining([
                onLikeAddedAck.type,
                onCommentCreatedAck.type,
            ]),
        );

        const snapshot = metaStorage.getSnapshot();
        expect(snapshot.appliedEventIds).toEqual(
            expect.arrayContaining(["evt-like-1", "evt-comment-1"]),
        );
    });

    it("does not apply events that were already marked as applied before sync", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        // 🧩 Seed : l'event est déjà considéré comme appliqué avant le premier sync
        await metaStorage.markEventsApplied(["evt-like-seeded"], 2000);

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const event: SyncEvent = {
            id: "evt-like-seeded",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-seeded",
                targetId: "cafe_B",
                server: {
                    count: 2,
                    me: true,
                    version: 2,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        store.dispatch(syncEventsReceived([event]));
        await flush();

        const types = rec.getTypes();

        // Comme l'id était déjà connu, on ne doit pas rejouer l'ACK
        expect(types.filter((t: string) => t === onLikeAddedAck.type)).toHaveLength(0);

        const snapshot = metaStorage.getSnapshot();
        // l'id reste présent une seule fois
        expect(
            snapshot.appliedEventIds.filter((id: string) => id === "evt-like-seeded"),
        ).toHaveLength(1);
    });

    it("applies an event only once even if received multiple times", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const event: SyncEvent = {
            id: "evt-like-once",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-once",
                targetId: "cafe_C",
                server: {
                    count: 3,
                    me: true,
                    version: 1,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        // 1er sync : on applique l'event
        store.dispatch(syncEventsReceived([event]));
        await flush();

        // 2e sync : même event, même id
        store.dispatch(syncEventsReceived([event]));
        await flush();

        const types = rec.getTypes();

        // onLikeAddedAck ne doit être dispatché qu'une seule fois
        expect(types.filter((t: string) => t === onLikeAddedAck.type)).toHaveLength(1);

        const snapshot = metaStorage.getSnapshot();
        // appliedEventIds contient l'id une seule fois (à toi de voir comment tu le gères
        expect(
            snapshot.appliedEventIds.filter((id: string) => id === "evt-like-once"),
        ).toHaveLength(1);
    });
});
