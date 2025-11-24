// commentUpdate.ack.integration.spec.ts
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
} from "@/app/core-logic/contextWL/outboxWl/sync/syncEventsListenerFactory";
import {
    syncEventsReceived,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import {
    SyncEvent,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import {
    createMemorySyncMetaStorage,
} from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";

describe("SyncEvent → comment.updatedAck (integration)", () => {
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
                syncEventsListenerFactory({ metaStorage }),
                ackListenerFactory({ gateways: {}, helpers: {} }, () => {}).middleware,
            ],
        });

        // seed commentaire existant (optimistic après update local)
        store.dispatch(
            addOptimisticCreated({
                entity: {
                    id: "cmt_srv_123",
                    targetId: "cafe_A",
                    body: "Ancien texte",
                    authorId: "user_test",
                    createdAt: "2025-10-10T07:00:00.000Z",
                    likeCount: 0,
                    replyCount: 0,
                    moderation: moderationTypes.PUBLISHED,
                    version: 1,
                    optimistic: true,
                },
            }),
        );

        // seed outbox CommentUpdate
        store.dispatch(
            enqueueCommitted({
                id: "obx_update_0001",
                item: {
                    command: {
                        kind: commandKinds.CommentUpdate,
                        commandId: "cmd_update_abc" as CommandId,
                        commentId: "cmt_srv_123",
                        newBody: "Nouveau texte local",
                        at: "2025-10-10T07:01:00.000Z" as ISODate,
                    },
                    undo: {
                        kind: commandKinds.CommentUpdate,
                        commentId: "cmt_srv_123",

                        prevBody: "Ancien texte",
                        prevVersion: 1,
                    },
                },
                enqueuedAt: "2025-10-10T07:01:00.000Z",
            }),
        );
    });

    it("applies comment.updatedAck from SyncEvent, reconciles body/version and drops outbox", async () => {
        // 👇 pour rester strictement sur le même modèle que le test create
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const syncEvent: SyncEvent = {
            id: "evt-comment-updated-1",
            happenedAt: "2025-10-10T07:01:05.000Z" as ISODate,
            type: "comment.updatedAck",
            payload: {
                commandId: "cmd_update_abc",
                commentId: "cmt_srv_123",
                server: {
                    body: "Nouveau texte validé",
                    version: 2,
                    updatedAt: "2025-10-10T07:01:05.000Z" as ISODate,
                },
            } as any,
        };

        store.dispatch(syncEventsReceived([syncEvent]));
        await flush();

        const s = store.getState();

        // ✅ commentaire mis à jour et plus optimiste
        const entity = s.cState.entities.entities["cmt_srv_123"];
        expect(entity).toMatchObject({
            id: "cmt_srv_123",
            body: "Nouveau texte validé",
            version: 2,
            optimistic: false,
        });

        // ✅ outbox nettoyée
        expect(s.oState.byCommandId["cmd_update_abc"]).toBeUndefined();
        expect(s.oState.byId["obx_update_0001"]).toBeUndefined();
    });
});
