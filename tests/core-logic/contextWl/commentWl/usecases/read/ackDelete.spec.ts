// ackDelete.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes, opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase"; // ou outbox actions directes
import {CommandId, commandKinds, ISODate} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {ackListenerFactory, onCommentDeletedAck} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import {commentsRetrieved} from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";

describe("On delete ACK received :", () => {
    let store: ReduxStoreWl;

    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackListenerFactory(
                { gateways: {}, helpers: {} },
                () => {}
            ).middleware], // important: passer l'objet listener (pas .middleware si ton init le mappe déjà)
        });

        // Seed: un commentaire existant (non-optimistic)
        store.dispatch(
            commentsRetrieved({
                targetId: "cafe_fragments_rennes",
                op: opTypes.RETRIEVE,
                items: [
                    {
                        id: "cmt_0001",
                        targetId: "cafe_fragments_rennes",
                        body: "Excellent flat white, ambiance au top.",
                        authorId: "user_1",
                        createdAt: "2025-10-10T07:00:00.000Z",
                        likeCount: 0,
                        replyCount: 0,
                        moderation: moderationTypes.PUBLISHED,
                        version: 1,
                    },
                ],
                nextCursor: undefined,
                prevCursor: undefined,
                serverTime: "2025-10-10T07:00:01.000Z",
            }) as any
        );

        // Seed: un record outbox “delete” en attente (simulateur : already queued + byCommandId)
        store.dispatch(
            enqueueCommitted({
                id: "obx_del_0001",
                item: {
                    command: {
                        kind: commandKinds.CommentDelete,
                        commandId: "cmd_del_123" as CommandId,
                        commentId: "cmt_0001",
                        at: "2025-10-10T07:00:02.000Z" as ISODate,
                    },
                    undo: {
                        kind: commandKinds.CommentDelete,
                        commentId: "cmt_0001",
                        prevBody: "Excellent flat white, ambiance au top.",
                        prevVersion: 1,
                    },
                },
                enqueuedAt: "2025-10-10T07:00:02.000Z",
            })
        );
    });

    it("should reconcile deletion and drop outbox on ACK", async () => {
        // Act: réception de l’ACK serveur
        store.dispatch(
            onCommentDeletedAck({
                commandId: "cmd_del_123",
                commentId: "cmt_0001",
                server: {
                    deletedAt: "2025-10-10T07:05:00.000Z", // horodatage serveur
                    version: 2,
                },
            })
        );

        await flush(); // laisser le listener agir

        const s = store.getState();

        // 1) Reconcile: l’entité est tombstonée avec les infos serveur et plus optimistic
        const c = s.cState.entities.entities["cmt_0001"];
        expect(c).toBeDefined();
        expect(c.deletedAt).toBe("2025-10-10T07:05:00.000Z");
        expect(c.version).toBe(2);
        expect(c.optimistic).toBe(false);
        // (optionnel) garder/modifier moderation
        // expect(c.moderation).toBe(moderationTypes.SOFT_DELETED);

        // 2) L’ID reste bien dans la vue (tombstone visible pour la cohérence du thread)
        expect(s.cState.byTarget["cafe_fragments_rennes"].ids).toContain("cmt_0001");

        // 3) Outbox: record supprimé + mapping commandId nettoyé
        expect(s.oState.byCommandId["cmd_del_123"]).toBeUndefined();
        expect(s.oState.byId["obx_del_0001"]).toBeUndefined();
    });
});
