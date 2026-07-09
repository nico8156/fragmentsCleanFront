import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";

import { addOptimisticCreated } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { cuAction, commentUpdateWlUseCase } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";

import { commandKinds, statusTypes, type CommandId, type ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { enqueueCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import type { CommentUpdateCommand } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForComment.type";
import {FakeCommentsWlGateway} from "@/tests/core-logic/fakes/FakeCommentsWlGateway";


const flushPromises = () => new Promise<void>((r) => setImmediate(r));

describe("Comments WRITE - UPDATE (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;
    let comments: FakeCommentsWlGateway;

    const targetId = "cafe_A";
    const commentId = "cmt_001";

    beforeEach(() => {
        comments = new FakeCommentsWlGateway();

        const deps: DependenciesWl = {
            gateways: { comments } as any,
            helpers: {
                nowIso: () => "2025-10-10T07:03:00.000Z" as ISODate,
                currentUserId: () => "user_test",
                currentUserProfile: () => ({ displayName: "Moi", avatarUrl: "http://avatar" }),
                newCommandId: () => "cmd_update_001" as CommandId,
                getCommandIdForTests: () => "obx_update_001",
            } as any,
        };

        store = initReduxStoreWl({
            dependencies: deps,
            listeners: [commentUpdateWlUseCase(deps).middleware],
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

    it("should apply optimistic update and enqueue outbox command", async () => {
        store.dispatch(cuAction({ commentId, newBody: "nouveau texte" }));
        await flushPromises();

        const s: any = store.getState();

        // optimistic entity
        const ent = s.cState.entities.entities[commentId];
        expect(ent.body).toBe("nouveau texte");
        expect(ent.optimistic).toBe(true);
        expect(ent.editedAt).toBe("2025-10-10T07:03:00.000Z");

        // outbox
        const rec = s.oState.byId["obx_update_001"];
        expect(rec).toBeDefined();
        expect(rec.status).toBe("queued");
        expect(s.oState.queue).toContain("obx_update_001");

        const cmd = rec.item.command as CommentUpdateCommand;
        expect(cmd.kind).toBe(commandKinds.CommentUpdate);
        expect(cmd.commandId).toBe("cmd_update_001");
        expect(cmd.commentId).toBe(commentId);
        expect(cmd.newBody).toBe("nouveau texte");
        expect(cmd.at).toBe("2025-10-10T07:03:00.000Z");

        // undo
        const undo = rec.item.undo;
        expect(undo.kind).toBe(commandKinds.CommentUpdate);
        expect(undo.commentId).toBe(commentId);
        expect(undo.prevBody).toBe("ancien texte");
        expect(undo.prevVersion).toBe(7);

        // mapping
        expect(s.oState.byCommandId["cmd_update_001"]).toBe("obx_update_001");
    });

    it("should ignore update if body is empty", async () => {
        store.dispatch(cuAction({ commentId, newBody: "   " }));
        await flushPromises();

        const s: any = store.getState();
        const ent = s.cState.entities.entities[commentId];

        expect(ent.body).toBe("ancien texte");
        expect(ent.optimistic).toBe(false);
        expect(s.oState.queue.length).toBe(0);
    });

    it("should not depend on hydrated auth state once the UI has requested update", async () => {
        store.dispatch(cuAction({ commentId, newBody: "texte modifié" }));
        await flushPromises();

        const s: any = store.getState();
        expect(s.cState.entities.entities[commentId].body).toBe("texte modifié");
        expect(s.oState.byId.obx_update_001.item.command.kind).toBe(commandKinds.CommentUpdate);
    });

    it("should allow update when a non-update command is already pending for the comment", async () => {
        store.dispatch(enqueueCommitted({
            id: "obx_delete_pending",
            item: {
                command: {
                    kind: commandKinds.CommentDelete,
                    commandId: "cmd_delete_pending",
                    commentId,
                    at: "2025-10-10T07:02:00.000Z",
                } as any,
                undo: { kind: commandKinds.CommentDelete, commentId, prevBody: "ancien texte", prevVersion: 7 } as any,
            },
            enqueuedAt: "2025-10-10T07:02:00.000Z",
        }) as any);
        (store.getState() as any).oState.byId.obx_delete_pending.status = statusTypes.awaitingAck;

        store.dispatch(cuAction({ commentId, newBody: "texte après pending" }));
        await flushPromises();

        const s: any = store.getState();
        expect(s.cState.entities.entities[commentId].body).toBe("texte après pending");
        expect(s.oState.byId.obx_update_001.item.command.kind).toBe(commandKinds.CommentUpdate);
    });
});
