import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";

import { addOptimisticCreated } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { uiCommentDeleteRequested, commentDeleteUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";

import { commandKinds, type CommandId, type ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { CommentDeleteCommand } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForComment.type";
import {FakeCommentsWlGateway} from "@/tests/core-logic/fakes/FakeCommentsWlGateway";


const flushPromises = () => new Promise<void>((r) => setImmediate(r));

describe("Comments WRITE - DELETE (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;
    let comments: FakeCommentsWlGateway;

    const targetId = "cafe_A";
    const commentId = "cmt_001";

    beforeEach(() => {
        comments = new FakeCommentsWlGateway();

        const deps: DependenciesWl = {
            gateways: { comments } as any,
            helpers: {
                nowIso: () => "2025-10-10T07:04:00.000Z" as ISODate,
                currentUserId: () => "user_test",
                currentUserProfile: () => ({ displayName: "Moi", avatarUrl: "http://avatar" }),
                newCommandId: () => "cmd_delete_001" as CommandId,
                getCommandIdForTests: () => "obx_delete_001",
            } as any,
        };

        store = initReduxStoreWl({
            dependencies: deps,
            listeners: [commentDeleteUseCaseFactory(deps).middleware],
        });

        // seed comment existant (non optimistic)
        store.dispatch(
            addOptimisticCreated({
                entity: {
                    id: commentId,
                    targetId,
                    parentId: undefined,
                    body: "ancien texte",
                    authorId: "user_test",
                    authorName: "Moi",
                    avatarUrl: "http://avatar",
                    createdAt: "2025-10-10T07:00:00.000Z",
                    editedAt: undefined,
                    deletedAt: undefined,
                    likeCount: 0,
                    replyCount: 0,
                    moderation: "PUBLISHED",
                    version: 7,
                    optimistic: false,
                } as any,
            }),
        );
    });

    it("should apply optimistic soft-delete and enqueue outbox command", async () => {
        store.dispatch(uiCommentDeleteRequested({ commentId }));
        await flushPromises();

        const s: any = store.getState();

        // optimistic entity
        const ent = s.cState.entities.entities[commentId];
        expect(ent.optimistic).toBe(true);
        expect(ent.moderation).toBe("SOFT_DELETED");
        expect(ent.deletedAt).toBe("2025-10-10T07:04:00.000Z");

        // outbox
        const rec = s.oState.byId["obx_delete_001"];
        expect(rec).toBeDefined();
        expect(rec.status).toBe("queued");
        expect(s.oState.queue).toContain("obx_delete_001");

        const cmd = rec.item.command as CommentDeleteCommand;
        expect(cmd.kind).toBe(commandKinds.CommentDelete);
        expect(cmd.commandId).toBe("cmd_delete_001");
        expect(cmd.commentId).toBe(commentId);
        expect(cmd.at).toBe("2025-10-10T07:04:00.000Z");

        // undo
        const undo = rec.item.undo;
        expect(undo.kind).toBe(commandKinds.CommentDelete);
        expect(undo.commentId).toBe(commentId);
        expect(undo.prevBody).toBe("ancien texte");
        expect(undo.prevVersion).toBe(7);

        // mapping
        expect(s.oState.byCommandId["cmd_delete_001"]).toBe("obx_delete_001");
    });

    it("should ignore delete if comment does not exist", async () => {
        store.dispatch(uiCommentDeleteRequested({ commentId: "missing" }));
        await flushPromises();

        const s: any = store.getState();
        expect(s.oState.queue.length).toBe(0);
    });
});
