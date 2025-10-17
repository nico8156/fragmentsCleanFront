// commentUpdate.ack.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes, opTypes } from "@/app/contextWL/commentWl/type/commentWl.type";

import { ackListenerFactory, onCommentUpdatedAck } from "@/app/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import { enqueueCommitted } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { commandKinds } from "@/app/contextWL/outboxWl/outbox.type";
import {commentsRetrieved} from "@/app/contextWL/commentWl/usecases/read/commentRetrieval";

describe("On Update ACK received (reconcile + drop outbox)", () => {
    let store: ReduxStoreWl;
    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackListenerFactory(
                { gateways: {}, helpers: {} },
                () => {}
                ).middleware],
        });

        // seed entité existante
        store.dispatch(commentsRetrieved({
            targetId: "cafe_A",
            op: opTypes.RETRIEVE,
            items: [{
                id: "cmt_0001",
                targetId: "cafe_A",
                body: "Ancien texte",
                authorId: "user_1",
                createdAt: "2025-10-10T06:59:00.000Z",
                likeCount: 0, replyCount: 0,
                moderation: moderationTypes.PUBLISHED, version: 1,
            }],
            nextCursor: undefined, prevCursor: undefined, serverTime: "2025-10-10T07:00:00.000Z"
        }) as any);

        // seed outbox update (queued)
        store.dispatch(enqueueCommitted({
            id: "obx_upd_001",
            item: {
                command: {
                    kind: commandKinds.CommentUpdate,
                    commandId: "cmd_upd_123",
                    commentId: "cmt_0001",
                    body: "Nouveau texte",
                    createdAt: "2025-10-10T07:00:02.000Z",
                },
                undo: {
                    kind: commandKinds.CommentUpdate,
                    commentId: "cmt_0001",
                    prevBody: "Ancien texte",
                    prevVersion: 1,
                },
            },
            enqueuedAt: "2025-10-10T07:00:02.000Z",
        }));
    });

    it("should finalize update and drop outbox on ACK", async () => {
        store.dispatch(onCommentUpdatedAck({
            commandId: "cmd_upd_123",
            commentId: "cmt_0001",
            server: { editedAt: "2025-10-10T07:00:05.000Z", version: 2, body: "Nouveau texte (modéré)" },
        }));
        await flush();

        const s = store.getState();

        // reconcile
        const c = s.cState.entities.entities["cmt_0001"]!;
        expect(c.optimistic).toBe(false);
        expect(c.editedAt).toBe("2025-10-10T07:00:05.000Z");
        expect(c.version).toBe(2);
        // si le serveur renvoie un body modéré :
        expect(c.body).toBe("Nouveau texte (modéré)");

        // drop outbox
        expect(s.oState.byCommandId["cmd_upd_123"]).toBeUndefined();
        expect(s.oState.byId["obx_upd_001"]).toBeUndefined();
    });
});
