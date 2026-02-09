import { createEntityAdapter, createReducer } from "@reduxjs/toolkit";

import type { CafeId, CommentEntity, CommentsStateWl, View } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { loadingStates, moderationTypes, opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import type { AppStateWl } from "@/app/store/appStateWl";

import {
	commentsRetrievalCancelled,
	commentsRetrievalFailed,
	commentsRetrievalPending,
	commentsRetrieved,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";

import { deleteReconciled, updateReconciled } from "@/app/core-logic/contextWL/commentWl/typeAction/commentAck.action";
import { addOptimisticCreated, deleteOptimisticApplied, updateOptimisticApplied } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { createReconciled, createRollback, deleteRollback, updateRollback } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";

const adapter = createEntityAdapter<CommentEntity>({
	sortComparer: (a, b) => {
		const ac = typeof a.createdAt === "string" ? a.createdAt : "";
		const bc = typeof b.createdAt === "string" ? b.createdAt : "";
		// plus récent d'abord (DESC)
		return bc.localeCompare(ac);
	},
});

const initialState: AppStateWl["comments"] = {
	entities: adapter.getInitialState(),
	byTarget: {},
};

// -----------------------
// helpers (view + merge)
// -----------------------
const ensureView = (state: CommentsStateWl, targetId: CafeId): View =>
(state.byTarget[targetId] ??= {
	ids: [],
	loading: loadingStates.IDLE,
	filters: { sort: "new" },
	staleAfterMs: 30_000,
});

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

const keepOptimisticIdsForTarget = (state: CommentsStateWl, v: View, targetId: CafeId): string[] =>
	(v.ids ?? []).filter((id) => {
		const e = state.entities.entities[id];
		return Boolean(e?.optimistic) && e?.targetId === targetId;
	});

const isOlderVersion = (curVersion: any, serverVersion: number) =>
	typeof curVersion === "number" && serverVersion < curVersion;

const normalizeIso = (v: any): string | undefined => (typeof v === "string" ? v : undefined);

const normalizeIncoming = (items: CommentEntity[]): CommentEntity[] =>
	items.map((i) => ({
		...i,
		createdAt: normalizeIso(i.createdAt) ?? new Date().toISOString(),
		editedAt: normalizeIso(i.editedAt),
		deletedAt: normalizeIso(i.deletedAt),
	}));

const computeIncomingIds = (targetId: CafeId, items: CommentEntity[]) =>
	items.filter((i) => i.targetId === targetId).map((i) => i.id);

const applyIdsByOp = (v: View, op: string, optimisticIds: string[], incomingIds: string[]) => {
	if (op === opTypes.RETRIEVE) {
		// ✅ IMPORTANT: ne pas perdre les optimistic pendant un RETRIEVE
		v.ids = [];
		mergeUniqueAppend(v.ids, optimisticIds);
		mergeUniqueAppend(v.ids, incomingIds);
		return;
	}

	if (op === opTypes.OLDER) {
		mergeUniqueAppend(v.ids, incomingIds);
		return;
	}

	if (op === opTypes.REFRESH) {
		// prepend serveur + conserver optimistic
		mergeUniquePrepend(v.ids, incomingIds);
		mergeUniquePrepend(v.ids, optimisticIds);
		return;
	}
};

export const commentWlReducer = createReducer(initialState, (builder) => {
	builder

		// =========================
		// OPTIMISTIC WRITE
		// =========================

		.addCase(addOptimisticCreated, (state, action) => {
			const c = action.payload.entity;

			adapter.addOne(state.entities, c);

			const v = ensureView(state, c.targetId);
			// nouveau commentaire en haut
			mergeUniquePrepend(v.ids, [c.id]);
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
					moderation: moderationTypes.SOFT_DELETED,
					optimistic: true,
				},
			});
		})

		// =========================
		// RECONCILE (ACK / outbox)
		// =========================

		.addCase(createReconciled, (state, action) => {
			const { commentId, server } = action.payload;
			const cur = state.entities.entities[commentId];
			if (!cur) return;

			if (isOlderVersion(cur.version, server.version)) return;

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

			if (isOlderVersion(cur.version, server.version)) return;

			adapter.updateOne(state.entities, {
				id: commentId,
				changes: {
					body: server.body ?? cur.body,
					editedAt: server.editedAt ?? cur.editedAt,
					version: server.version,
					optimistic: false,
				},
			});
		})

		.addCase(deleteReconciled, (state, action) => {
			const { commentId, server } = action.payload;
			const cur = state.entities.entities[commentId];
			if (!cur) return;

			if (isOlderVersion(cur.version, server.version)) return;

			adapter.updateOne(state.entities, {
				id: commentId,
				changes: {
					deletedAt: server.deletedAt,
					version: server.version,
					optimistic: false,
					moderation: moderationTypes.SOFT_DELETED,
				},
			});
		})

		// =========================
		// ROLLBACKS
		// =========================

		.addCase(createRollback, (state, action) => {
			const { tempId, targetId } = action.payload;

			// ici tempId == commentId (front source of truth)
			adapter.removeOne(state.entities, tempId);

			const v = state.byTarget[targetId];
			if (v) v.ids = (v.ids ?? []).filter((id) => id !== tempId);
		})

		.addCase(updateRollback, (state, action) => {
			const { commentId, prevBody, prevVersion } = action.payload;
			if (!commentId) return;

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
					moderation: moderationTypes.PUBLISHED,
				},
			});
		})

		// =========================
		// READ PIPELINE
		// =========================

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

			// normalize + upsert
			const normalized = normalizeIncoming(items);
			adapter.upsertMany(state.entities, normalized);

			const v = ensureView(state, targetId);

			// ✅ preserve optimistic already in view (fix “first send” disappearing)
			const optimisticIds = keepOptimisticIdsForTarget(state, v, targetId);
			const incomingIds = computeIncomingIds(targetId, items);

			// merge ids by op
			applyIdsByOp(v, op, optimisticIds, incomingIds);

			// cursors + anchor
			v.nextCursor = nextCursor ?? v.nextCursor;
			v.prevCursor = prevCursor ?? v.prevCursor;
			if (serverTime) v.anchor = serverTime;

			// state
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

