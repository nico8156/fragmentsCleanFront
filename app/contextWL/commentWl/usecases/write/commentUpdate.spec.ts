// commentUpdate.listener.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes, opTypes } from "@/app/contextWL/commentWl/type/commentWl.type";
import { commentUpdateWlUseCase, cuAction } from "@/app/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";
import { commandKinds } from "@/app/contextWL/outboxWl/outbox.type";
import {commentsRetrieved} from "@/app/contextWL/commentWl/usecases/read/commentRetrieval";

describe("On Update Comment pressed button  (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [
                commentUpdateWlUseCase({
                    gateways: {},
                    helpers: {
                        nowIso: () => "2025-10-10T07:00:02.000Z",
                        getCommandIdForTests: () => "obx_upd_001", // ← outboxId stable
                    },
                },
                    () => {}
                    ).middleware,
            ],
        });

        // seed: entité existante (non-optimistic)
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
    });

    it("should patch entity optimistically and enqueue Comment.Update", () => {
        store.dispatch(cuAction({ commentId: "cmt_0001", newBody: "Nouveau texte" }));

        const s = store.getState();

        // 1) optimistic patch
        const c = s.cState.entities.entities["cmt_0001"]!;
        expect(c.body).toBe("Nouveau texte");
        expect(c.editedAt).toBe("2025-10-10T07:00:02.000Z");
        expect(c.optimistic).toBe(true);

        // 2) outbox
        const obxId = "obx_upd_001";
        const rec = s.oState.byId[obxId]!;
        expect(s.oState.queue).toContain(obxId);
        expect(rec.item.command.kind).toBe(commandKinds.CommentUpdate);
        expect(rec.item.command.commentId).toBe("cmt_0001");
        expect(rec.item.command.body).toBe("Nouveau texte");
        // snapshot pour rollback
        expect(rec.item.undo.prevBody).toBe("Ancien texte");
        expect(rec.status).toBe("queued");
    });
});
