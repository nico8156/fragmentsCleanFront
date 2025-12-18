// commentWl.reducer.ts
import { createEntityAdapter, createReducer } from "@reduxjs/toolkit";
import type { AppStateWl } from "@/app/store/appStateWl";
import type {
    CafeId,
    CommentEntity,
    CommentsStateWl,
    View,
} from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import { loadingStates, opTypes } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";

import { addOptimisticCreated } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { updateOptimisticApplied } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";
import { deleteOptimisticApplied } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";

import {
    commentsRetrievalCancelled,
    commentsRetrievalFailed,
    commentsRetrievalPending,
    commentsRetrieved,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";

import {
    createReconciled,
    createRollback,
    updateRollback,
    deleteRollback,
} from "@/app/core-logic/contextWL/outboxWl/processOutbox";

import { updateReconciled, deleteReconciled } from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

const adapter = createEntityAdapter<CommentEntity>({
    sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

const initialState: AppStateWl["comments"] = {
    entities: adapter.getInitialState(),
    byTarget: {},
};

const ensureView = (state: CommentsStateWl, targetId: CafeId): View => {
    return (state.byTarget[targetId] ??= {
        ids: [],
        loading: loadingStates.IDLE,
        filters: { sort: "new" },
        staleAfterMs: 30_000,
    });
};

const mergeUniqueAppend = (dst: string[], src: string[]) => {
    const seen = new Set(dst);
    for (const id of src) {
        if (!seen.has(id)) {
            dst.push(id);
            seen.add(id);
        }
    }
};

const mergeUniquePrepend = (dst: string[], src: string[]) => {
    const seen = new Set(dst);
    for (let i = src.length - 1; i >= 0; i--) {
        const id = src[i];
        if (!seen.has(id)) {
            dst.unshift(id);
            seen.add(id);
        }
    }
};

export const commentWlReducer = createReducer(initialState, (builder) => {
    builder
        // ----- optimistic write

        .addCase(addOptimisticCreated, (state, action) => {
            const c = action.payload.entity;

            adapter.addOne(state.entities, c);

            const v = ensureView(state, c.targetId);
            mergeUniquePrepend(v.ids, [c.id]);

            return;
        })

        .addCase(updateOptimisticApplied, (state, action) => {
            const { commentId, newBody, clientEditedAt } = action.payload;
            const cur = state.entities.entities[commentId];
            if (!cur) return;

            adapter.updateOne(state.entities, {
                id: commentId,
                changes: {
                    body: newBody,
                    editedAt: clientEditedAt,
                    optimistic: true,
                },
            });
        })

        .addCase(deleteOptimisticApplied, (state, action) => {
            const { commentId, clientDeletedAt } = action.payload;
            const cur = state.entities.entities[commentId];
            if (!cur) return;

            adapter.updateOne(state.entities, {
                id: commentId,
                changes: {
                    deletedAt: clientDeletedAt,
                    moderation: "SOFT_DELETED",
                    optimistic: true,
                },
            });
        })

        // ----- reconciled from server/outbox/ack

        .addCase(createReconciled, (state, action) => {
            const { commentId, server } = action.payload;
            const cur = state.entities.entities[commentId];
            if (!cur) return;

            adapter.updateOne(state.entities, {
                id: commentId,
                changes: {
                    optimistic: false,
                    createdAt: server.createdAt,
                    version: server.version,
                },
            });
        })

        .addCase(updateReconciled, (state, action) => {
            const { commentId, server } = action.payload;
            const cur = state.entities.entities[commentId];
            if (!cur) return;

            adapter.updateOne(state.entities, {
                id: commentId,
                changes: {
                    body: server.body ?? cur.body,
                    editedAt: server.editedAt,
                    version: server.version,
                    optimistic: false,
                },
            });
        })

        .addCase(deleteReconciled, (state, action) => {
            const { commentId, server } = action.payload;
            const cur = state.entities.entities[commentId];
            if (!cur) return;

            adapter.updateOne(state.entities, {
                id: commentId,
                changes: {
                    deletedAt: server.deletedAt,
                    version: server.version,
                    optimistic: false,
                    moderation: "SOFT_DELETED",
                },
            });
        })

        // ----- rollbacks

        .addCase(createRollback, (state, action) => {
            const { tempId, targetId } = action.payload;

            adapter.removeOne(state.entities, tempId);

            const v = state.byTarget[targetId];
            if (v) v.ids = v.ids.filter((id) => id !== tempId);
        })

        .addCase(updateRollback, (state, action) => {
            const { commentId, prevBody, prevVersion } = action.payload;
            if (!commentId) return;               // ✅ important

            const cur = state.entities.entities[commentId];
            if (!cur) return;

            adapter.updateOne(state.entities, {
                id: commentId,
                changes: {
                    body: prevBody,
                    version: prevVersion ?? cur.version,
                    optimistic: false,
                },
            });
        })

        .addCase(deleteRollback, (state, action) => {
            const { commentId, prevBody, prevVersion, prevDeletedAt } = action.payload;
            const cur = state.entities.entities[commentId];
            if (!cur) return;

            adapter.updateOne(state.entities, {
                id: commentId,
                changes: {
                    body: prevBody,
                    version: prevVersion ?? cur.version,
                    deletedAt: prevDeletedAt ?? undefined,
                    optimistic: false,
                    moderation: "PUBLISHED",
                },
            });
        })

        // ----- read pipeline

        .addCase(commentsRetrievalPending, (state, action) => {
            const { targetId } = action.payload;
            const v = ensureView(state, targetId);
            v.loading = loadingStates.PENDING;
            v.error = undefined;
        })

        .addCase(commentsRetrievalCancelled, (state, action) => {
            const { targetId } = action.payload;
            const v = ensureView(state, targetId);
            v.loading = loadingStates.IDLE;
        })

        .addCase(commentsRetrieved, (state, action) => {
            const { targetId, op, items, nextCursor, prevCursor, serverTime } = action.payload;

            // catalogue
            adapter.upsertMany(state.entities, items);

            // view
            const v = ensureView(state, targetId);

            const incomingIds = items
                .filter((i) => i.targetId === targetId)
                .map((i) => i.id);

            if (op === opTypes.RETRIEVE) {
                v.ids = [];
                mergeUniqueAppend(v.ids, incomingIds);
                if (serverTime) v.anchor = serverTime;
            } else if (op === opTypes.OLDER) {
                mergeUniqueAppend(v.ids, incomingIds);
            } else if (op === opTypes.REFRESH) {
                mergeUniquePrepend(v.ids, incomingIds);
                if (serverTime) v.anchor = serverTime;
            }

            v.nextCursor = nextCursor ?? v.nextCursor; // ✅
            v.prevCursor = prevCursor ?? v.prevCursor; // ✅

            v.loading = loadingStates.SUCCESS;
            v.error = undefined;
            v.lastFetchedAt = new Date().toISOString();
        })

        .addCase(commentsRetrievalFailed, (state, action) => {
            const { targetId, error } = action.payload;
            const v = ensureView(state, targetId);
            v.loading = loadingStates.ERROR;
            v.error = error;
        });
});
