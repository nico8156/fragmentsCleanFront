import type { AppStateWl } from "@/app/store/appStateWl";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { likeReconciled } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { dropCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import type { ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { logger } from "@/app/core-logic/utils/logger";

// ⬇️ NEW (badge doux)
import { likeSyncAcked } from "@/app/core-logic/contextWL/likeWl/typeAction/likeSync.action";

export const onLikeAddedAck = createAction<{
	commandId: string;
	targetId: string;
	server: { count: number; me: boolean; version: number; updatedAt?: ISODate };
}>("SERVER/LIKE/ADDED_ACK");

export const onLikeRemovedAck = createAction<{
	commandId: string;
	targetId: string;
	server: { count: number; me: boolean; version: number; updatedAt?: ISODate };
}>("SERVER/LIKE/REMOVED_ACK");

export const ackLikesListenerFactory = () => {
	const mw = createListenerMiddleware<AppStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

	listen({
		actionCreator: onLikeAddedAck,
		effect: async ({ payload }, api) => {
			const { commandId, targetId, server } = payload;
			logger.info("[ACK_LIKES] added", { commandId, targetId, version: server.version });

			// ✅ Source of truth
			api.dispatch(likeReconciled({ targetId, server }));

			// ✅ UI feedback (green ring for a short time)
			api.dispatch(likeSyncAcked({ targetId, commandId, ttlMs: 900 }));

			// ✅ ALWAYS drop (idempotent)
			api.dispatch(dropCommitted({ commandId }));
		},
	});

	listen({
		actionCreator: onLikeRemovedAck,
		effect: async ({ payload }, api) => {
			const { commandId, targetId, server } = payload;
			logger.info("[ACK_LIKES] removed", { commandId, targetId, version: server.version });

			api.dispatch(likeReconciled({ targetId, server }));
			api.dispatch(likeSyncAcked({ targetId, commandId, ttlMs: 900 }));
			api.dispatch(dropCommitted({ commandId }));
		},
	});

	return mw.middleware;
};
