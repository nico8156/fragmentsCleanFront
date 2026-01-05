import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";

import {
    onCommentCreatedAck,
    onCommentUpdatedAck,
    onCommentDeletedAck,
    ackListenerFactory,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

import {
    addOptimisticCreated,
    updateOptimisticApplied,
    deleteOptimisticApplied,
} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";

import { enqueueCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {commandKinds, type ISODate, parseToCommandId} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

const flushPromises = () => new Promise<void>((r) => setImmediate(r));

describe("Comments ACK (reconcile + drop outbox)", () => {
    let store: ReduxStoreWl;

    const targetId = "cafe_A";
    const commentId = "cmt_tmp_001"; // = tempId côté front, identique côté back (ton contrat)
    const body = "hello";
    const createdAt = "2025-10-10T07:00:00.000Z" as ISODate;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackListenerFactory().middleware],
        });
    });

    it("ACK created: createReconciled + dropCommitted", async () => {
        // 1) seed comment optimistic (comme après create write)
        store.dispatch(
            addOptimisticCreated({
                entity: {
                    id: commentId,
                    targetId,
                    parentId: undefined,
                    body,
                    authorId: "user_test",
                    authorName: "Moi",
                    avatarUrl: undefined,
                    createdAt,
                    likeCount: 0,
                    replyCount: 0,
                    moderation: "PUBLISHED",
                    version: 0,
                    optimistic: true,
                } as any,
            }),
        );

        // 2) seed outbox (commande en attente ack)
        store.dispatch(
            enqueueCommitted({
                id: "obx_c_001",
                item: {
                    command: {
                        kind: commandKinds.CommentCreate,
                        commandId: "cmd_c_001",
                        tempId: commentId,
                        targetId,
                        parentId: undefined,
                        body,
                        at: createdAt,
                    },
                    undo: {
                        kind: commandKinds.CommentCreate,
                        commentId,
                        targetId,
                        parentId: undefined,
                    },
                },
                enqueuedAt: createdAt,
            }),
        );

        // 3) ACK serveur
        store.dispatch(
            onCommentCreatedAck({
                commandId: "cmd_c_001",
                commentId,
                targetId,
                server: { createdAt: "2025-10-10T07:00:05.000Z", version: 1 },
            }),
        );
        await flushPromises();

        const s: any = store.getState();

        // comment reconciled
        const ent = s.cState.entities.entities[commentId];
        expect(ent).toBeDefined();
        expect(ent.optimistic).toBe(false);
        expect(ent.createdAt).toBe("2025-10-10T07:00:05.000Z");
        expect(ent.version).toBe(1);

        // outbox dropped
        expect(s.oState.byId["obx_c_001"]).toBeUndefined();
        expect(s.oState.byCommandId["cmd_c_001"]).toBeUndefined();
    });

    it("ACK updated: updateReconciled + dropCommitted", async () => {
        // 1) seed comment (existant)
        store.dispatch(
            addOptimisticCreated({
                entity: {
                    id: commentId,
                    targetId,
                    parentId: undefined,
                    body: "old",
                    authorId: "user_test",
                    authorName: "Moi",
                    createdAt,
                    likeCount: 0,
                    replyCount: 0,
                    moderation: "PUBLISHED",
                    version: 7,
                    optimistic: false,
                } as any,
            }),
        );

        // 2) simulate optimistic update (comme après write update)
        store.dispatch(
            updateOptimisticApplied({
                commentId,
                newBody: "new",
                clientEditedAt: "2025-10-10T07:02:00.000Z" as ISODate,
            }),
        );

        // 3) seed outbox update
        store.dispatch(
            enqueueCommitted({
                id: "obx_u_001",
                item: {
                    command: {
                        kind: commandKinds.CommentUpdate,
                        commandId: parseToCommandId("cmd_u_001"),
                        commentId,
                        newBody: "new",
                        at: "2025-10-10T07:02:00.000Z" as ISODate,
                    },
                    undo: {
                        kind: commandKinds.CommentUpdate,
                        commentId,
                        prevBody: "old",
                        prevVersion: 7,
                    },
                },
                enqueuedAt: "2025-10-10T07:02:00.000Z" as ISODate,
            }),
        );

        // 4) ACK serveur
        store.dispatch(
            onCommentUpdatedAck({
                commandId: "cmd_u_001",
                commentId,
                targetId,
                server: { editedAt: "2025-10-10T07:02:05.000Z", version: 8 },
            }),
        );
        await flushPromises();

        const s: any = store.getState();

        const ent = s.cState.entities.entities[commentId];
        expect(ent).toBeDefined();
        expect(ent.body).toBe("new");
        expect(ent.editedAt).toBe("2025-10-10T07:02:05.000Z");
        expect(ent.version).toBe(8);
        expect(ent.optimistic).toBe(false);

        // outbox dropped
        expect(s.oState.byId["obx_u_001"]).toBeUndefined();
        expect(s.oState.byCommandId["cmd_u_001"]).toBeUndefined();
    });

    it("ACK deleted: deleteReconciled + dropCommitted", async () => {
        // 1) seed comment (existant)
        store.dispatch(
            addOptimisticCreated({
                entity: {
                    id: commentId,
                    targetId,
                    parentId: undefined,
                    body,
                    authorId: "user_test",
                    authorName: "Moi",
                    createdAt,
                    likeCount: 0,
                    replyCount: 0,
                    moderation: "PUBLISHED",
                    version: 3,
                    optimistic: false,
                } as any,
            }),
        );

        // 2) simulate optimistic delete (comme après write delete)
        store.dispatch(
            deleteOptimisticApplied({
                commentId,
                clientDeletedAt: "2025-10-10T07:04:00.000Z" as ISODate,
            }),
        );

        // 3) seed outbox delete
        store.dispatch(
            enqueueCommitted({
                id: "obx_d_001",
                item: {
                    command: {
                        kind: commandKinds.CommentDelete,
                        commandId: parseToCommandId("cmd_d_001"),
                        commentId,
                        at: "2025-10-10T07:04:00.000Z" as ISODate,
                    },
                    undo: {
                        kind: commandKinds.CommentDelete,
                        commentId,
                        prevBody: body,
                        prevDeletedAt: undefined,
                        prevVersion: 3,
                    },
                },
                enqueuedAt: "2025-10-10T07:04:00.000Z" as ISODate,
            }),
        );

        // 4) ACK serveur
        store.dispatch(
            onCommentDeletedAck({
                commandId: "cmd_d_001",
                commentId,
                targetId,
                server: { deletedAt: "2025-10-10T07:04:05.000Z", version: 4 },
            }),
        );
        await flushPromises();

        const s: any = store.getState();

        const ent = s.cState.entities.entities[commentId];
        expect(ent).toBeDefined();
        expect(ent.deletedAt).toBe("2025-10-10T07:04:05.000Z");
        expect(ent.version).toBe(4);
        expect(ent.optimistic).toBe(false);
        expect(ent.moderation).toBe("SOFT_DELETED"); // ton reducer force soft delete

        // outbox dropped
        expect(s.oState.byId["obx_d_001"]).toBeUndefined();
        expect(s.oState.byCommandId["cmd_d_001"]).toBeUndefined();
    });
});
