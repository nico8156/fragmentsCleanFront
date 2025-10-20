// commentCreate.listener.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes } from "@/app/contextWL/commentWl/type/commentWl.type";
import { uiCommentCreateRequested, createCommentUseCaseFactory } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { commandKinds } from "@/app/contextWL/outboxWl/type/outbox.type";

describe("On Create button pressed (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [
                createCommentUseCaseFactory({
                    gateways: {}, // pas de call réseau ici
                    helpers: {
                        nowIso: () => "2025-10-10T07:00:00.000Z",
                        currentUserId: () => "user_test",
                        getCommentIdForTests: () => "cmt_tmp_123",
                        getCommandIdForTests: () => "obx_123", // ← outboxId stable
                    },
                },() => {}).middleware,
            ],
        });
    });

    it("should add optimistic entity and enqueue Comment.Create", () => {
        // Act
        store.dispatch(uiCommentCreateRequested({ targetId: "cafe_A", body: "Un super café !" }));

        // Assert
        const s = store.getState();

        // 1) optimistic entity
        const c = s.cState.entities.entities["cmt_tmp_123"]!;
        expect(c).toMatchObject({
            id: "cmt_tmp_123",
            targetId: "cafe_A",
            body: "Un super café !",
            authorId: "user_test",
            createdAt: "2025-10-10T07:00:00.000Z",
            optimistic: true,
            moderation: moderationTypes.PUBLISHED,
            version: 0,
        });
        // vue : id au début (prepend)
        expect(s.cState.byTarget["cafe_A"].ids[0]).toBe("cmt_tmp_123");

        // 2) outbox record
        const obxId = "obx_123";
        const rec = s.oState.byId[obxId]!;
        expect(s.oState.queue).toContain(obxId);
        expect(s.oState.byCommandId[rec.item.command.commandId]).toBe(obxId);
        expect(rec.item.command).toMatchObject({
            kind: commandKinds.CommentCreate,
            tempId: "cmt_tmp_123",
            targetId: "cafe_A",
            body: "Un super café !",
        });
        expect(rec.status).toBe("queued");
    });
});
