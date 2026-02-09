import { likeSyncPending } from "@/app/core-logic/contextWL/likeWl/typeAction/likeSync.action";
import { createAction, createListenerMiddleware, nanoid, TypedStartListening } from "@reduxjs/toolkit";

import { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";

import { likeOptimisticApplied, unlikeOptimisticApplied } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { enqueueCommitted, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds, ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";


export const uiLikeToggleRequested = createAction<{ targetId: string }>("UI/LIKE/TOGGLE_REQUESTED");

export const likeToggleUseCaseFactory = (deps: DependenciesWl) => {
	const mw = createListenerMiddleware();
	const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

	listen({
		actionCreator: uiLikeToggleRequested,
		effect: async ({ payload: { targetId } }, api) => {

			console.log("[LIKE] uiLikeToggleRequested", { targetId });

			const token = await deps.gateways.authToken!.getAccessToken();
			const userId = deps.gateways.authToken!.getCurrentUserId();

			if (!token || !userId) {
				console.log("[LIKE] no token/userId yet → ignoring like toggle");
				return;
			}

			const state: any = api.getState();

			const me = state.lState.byTarget?.[targetId]?.me ?? false;
			// ✅ outboxId: interne front, peut rester nanoid
			const outboxId = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;

			// ✅ commandId: UUID v4 (corrélation back/front)
			const commandId = deps.helpers.newCommandId();

			const at = (deps.helpers?.nowIso?.() ?? new Date().toISOString()) as ISODate;

			if (!deps.gateways.likes) return;

			if (!me) {
				api.dispatch(likeOptimisticApplied({ targetId, clientAt: at }));
				api.dispatch(likeSyncPending({ targetId, commandId, ttlMs: 2_000 }));

				api.dispatch(
					enqueueCommitted({
						id: outboxId,
						item: {
							command: { kind: commandKinds.LikeAdd, commandId, targetId, at },
							undo: {
								kind: commandKinds.LikeAdd,
								targetId,
								prevCount: state.lState.byTarget[targetId]?.count ?? 0,
								prevMe: false,
								prevVersion: state.lState.byTarget[targetId]?.version,
							},
						},
						enqueuedAt: at,
					}),
				);
			} else {
				api.dispatch(unlikeOptimisticApplied({ targetId, clientAt: at }));
				api.dispatch(likeSyncPending({ targetId, commandId, ttlMs: 2_000 }));
				api.dispatch(
					enqueueCommitted({
						id: outboxId,
						item: {
							command: { kind: commandKinds.LikeRemove, commandId, targetId, at },
							undo: {
								kind: commandKinds.LikeRemove,
								targetId,
								prevCount: state.lState.byTarget[targetId]?.count ?? 0,
								prevMe: true,
								prevVersion: state.lState.byTarget[targetId]?.version,
							},
						},
						enqueuedAt: at,
					}),
				);
			}

			api.dispatch(outboxProcessOnce());
		},
	});

	return mw;
};
