// commentDelete.ack.integration.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";

import {
    ackListenerFactory,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

import {
    enqueueCommitted,
    addOptimisticCreated,
} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";

import {
    CommandId,
    commandKinds,
    ISODate,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import {
    syncEventsListenerFactory,
} from "@/app/core-logic/contextWL/outboxWl/sync_PARKING/parking/syncEventsListenerFactory";
import {
    syncEventsReceived,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import {
    SyncEvent,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import {
    createMemorySyncMetaStorage,
} from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";
import {deleteOptimisticApplied} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";

describe("SyncEvent → comment.deletedAck (integration)", () => {
    let store: ReduxStoreWl;
    const flush = () => new Promise<void>((r) => setTimeout(r, 0));

    beforeEach(async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        store = initReduxStoreWl({
            dependencies: {
                gateways: {},
                helpers: {},
            },
            listeners: [
                syncEventsListenerFactory({metaStorage}),
                ackListenerFactory({gateways: {}, helpers: {}}, () => {
                }).middleware,
            ],
        });

        // seed commentaire existant
        store.dispatch(
            addOptimisticCreated({
                entity: {
                    id: "cmt_srv_123",
                    targetId: "cafe_A",
                    body: "Comment à supprimer",
                    authorId: "user_test",
                    createdAt: "2025-10-10T07:00:00.000Z",
                    likeCount: 0,
                    replyCount: 0,
                    moderation: moderationTypes.PUBLISHED,
                    version: 1,
                    optimistic: false, // ou true, comme tu veux au départ
                },
            }),
        );

// 🧩 étape qu’on avait oubliée : l’optimistic delete
        store.dispatch(
            deleteOptimisticApplied({
                commentId: "cmt_srv_123",
                clientDeletedAt: "2025-10-10T07:02:00.000Z" as ISODate,
            }),
        );

// puis seed outbox CommentDelete
        store.dispatch(
            enqueueCommitted({
                id: "obx_delete_0001",
                item: {
                    command: {
                        kind: commandKinds.CommentDelete,
                        commandId: "cmd_del_abc" as CommandId,
                        commentId: "cmt_srv_123",
                        at: "2025-10-10T07:02:00.000Z" as ISODate,
                    },
                    undo: {
                        kind: commandKinds.CommentDelete,
                        commentId: "cmt_srv_123",
                    },
                },
                enqueuedAt: "2025-10-10T07:02:00.000Z",
            }),
        );
    })


    it("applies comment.deletedAck from SyncEvent, removes comment and drops outbox", async () => {
        // 👇 même pattern que pour create
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const syncEvent: SyncEvent = {
            id: "evt-comment-deleted-1",
            happenedAt: "2025-10-10T07:02:05.000Z" as ISODate,
            type: "comment.deletedAck",
            payload: {
                commandId: "cmd_del_abc",
                commentId: "cmt_srv_123",
                server: {
                    deletedAt: "2025-10-10T07:02:05.000Z" as ISODate,
                    version: 2,
                },
            } as any,
        };

        store.dispatch(syncEventsReceived([syncEvent]));
        await flush();

        const s = store.getState();

        // ✅ le commentaire ne doit plus exister
        const target = s.cState.byTarget["cafe_A"];
        expect(target.ids).toContain("cmt_srv_123");

        const entity = s.cState.entities.entities["cmt_srv_123"];
        expect(s.cState.entities.entities["cmt_srv_123"]).toBeDefined();

        expect(entity).toMatchObject({
            moderation: moderationTypes.SOFT_DELETED, // ou le flag que tu utilises
            optimistic: false,
        });

        // ✅ outbox nettoyée
        expect(s.oState.byCommandId["cmd_del_abc"]).toBeUndefined();
        expect(s.oState.byId["obx_delete_0001"]).toBeUndefined();
    })
})
