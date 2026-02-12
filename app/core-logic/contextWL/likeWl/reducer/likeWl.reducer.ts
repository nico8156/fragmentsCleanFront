import {
	likeSyncAcked,
	likeSyncCleared,
	likeSyncFailed,
	likeSyncPending,
} from "@/app/core-logic/contextWL/likeWl/typeAction/likeSync.action";
import {
	likeOptimisticApplied,
	likeReconciled,
	likeRollback,
	likesRetrievalFailed,
	likesRetrievalPending,
	likesRetrieved,
	unlikeOptimisticApplied,
} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { createReducer } from "@reduxjs/toolkit";

import {
	LikeAggregate,
	LikesStateWl,
	LoadingState,
	loadingStates,
	TargetId,
} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { AppStateWl } from "@/app/store/appStateWl";

const DEFAULT_STALE_AFTER_MS = 60_000;

const initialState: AppStateWl["likes"] = { byTarget: {} };

/**
 * ✅ Option A:
 * - lastFetchedAtMs: number (epoch ms)
 * - lastFetchedAt (ISO string) supprimé côté logique de staleness
 *   (tu peux le garder si tu veux juste pour debug, mais pas nécessaire)
 */
const ensureAgg = (
	state: LikesStateWl,
	targetId: TargetId,
): LikeAggregate & {
	loading: LoadingState;
	error?: string;
	// ✅ ms only
	lastFetchedAtMs?: number;
	staleAfterMs?: number;
} =>
(state.byTarget[targetId] ??= {
	targetId,
	count: 0,
	me: false,
	version: 0,
	loading: loadingStates.IDLE,
	staleAfterMs: DEFAULT_STALE_AFTER_MS,

	// ✅ init
	lastFetchedAtMs: undefined,
});

export const likeWlReducer = createReducer(initialState, (builder) => {
	builder.addCase(likesRetrievalPending, (state, { payload: { targetId } }) => {
		const v = ensureAgg(state, targetId);
		v.loading = loadingStates.PENDING;
		v.error = undefined;
	});

	builder.addCase(
		likesRetrieved,
		(state, { payload: { targetId, count, me, version, serverTime } }) => {
			const v = ensureAgg(state, targetId);

			v.count = count;
			v.me = me;
			v.version = version;

			// ✅ serverTime conserve le rôle “updatedAt”
			v.updatedAt = (serverTime as ISODate) ?? (v.updatedAt as ISODate);

			// ✅ Option A: timestamp ms (évite parse/NaN)
			v.lastFetchedAtMs = Date.now();

			v.staleAfterMs = v.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
			v.loading = loadingStates.SUCCESS;
			v.optimistic = false;
		},
	);

	builder.addCase(likesRetrievalFailed, (state, { payload: { targetId, error } }) => {
		const v = ensureAgg(state, targetId);
		v.loading = loadingStates.ERROR;
		v.error = error;
	});

	// WRITE optimistic
	builder.addCase(likeOptimisticApplied, (state, { payload: { targetId } }) => {
		const v = ensureAgg(state, targetId);
		if (!v.me) {
			v.count = Math.max(0, v.count + 1);
			v.me = true;
			v.optimistic = true;
		}
	});

	builder.addCase(unlikeOptimisticApplied, (state, { payload: { targetId } }) => {
		const v = ensureAgg(state, targetId);
		if (v.me) {
			v.count = Math.max(0, v.count - 1);
			v.me = false;
			v.optimistic = true;
		}
	});

	// RECONCILE
	builder.addCase(likeReconciled, (state, { payload: { targetId, server } }) => {
		if (server.version < state.byTarget[targetId]?.version) {
			return; // ignore ACK plus vieux
		}

		const v = ensureAgg(state, targetId);
		v.count = server.count;
		v.me = server.me;
		v.version = server.version;

		v.updatedAt = server.updatedAt ?? v.updatedAt;

		// ✅ Option A
		v.lastFetchedAtMs = Date.now();

		v.staleAfterMs = v.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
		v.optimistic = false;

		// garde loading si pas en pending
		v.loading = v.loading === loadingStates.PENDING ? loadingStates.SUCCESS : v.loading;
	});

	// ROLLBACK
	builder.addCase(
		likeRollback,
		(state, { payload: { targetId, prevCount, prevMe, prevVersion } }) => {
			const v = ensureAgg(state, targetId);
			v.count = prevCount;
			v.me = prevMe;
			v.version = prevVersion ?? v.version;
			v.optimistic = false;
			// ne change pas loading ici
		},
	);

	// SYNC UI ring
	builder.addCase(likeSyncPending, (state, { payload }) => {
		const v = ensureAgg(state, payload.targetId);
		const ttl = payload.ttlMs ?? 10_000; // pending visible max 10s
		v.sync = { state: "pending", commandId: payload.commandId, untilMs: Date.now() + ttl };
	});

	builder.addCase(likeSyncAcked, (state, { payload }) => {
		const v = ensureAgg(state, payload.targetId);

		// ignore si un nouveau commandId a remplacé l'ancien
		if (v.sync?.commandId && v.sync.commandId !== payload.commandId) return;

		const ttl = payload.ttlMs ?? 900; // vert ~0.9s
		v.sync = { state: "acked", commandId: payload.commandId, untilMs: Date.now() + ttl };

		v.optimistic = false;
	});

	builder.addCase(likeSyncFailed, (state, { payload }) => {
		const v = ensureAgg(state, payload.targetId);
		if (v.sync?.commandId && v.sync.commandId !== payload.commandId) return;

		const ttl = payload.ttlMs ?? 1500;
		v.sync = { state: "failed", commandId: payload.commandId, untilMs: Date.now() + ttl };
		v.optimistic = false;
	});

	builder.addCase(likeSyncCleared, (state, { payload }) => {
		const v = ensureAgg(state, payload.targetId);
		if (!v.sync) return;
		delete (v as any).sync;
	});
});

