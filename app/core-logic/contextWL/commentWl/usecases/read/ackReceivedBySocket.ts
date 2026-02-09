import type { AppStateWl } from "@/app/store/appStateWl";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { deleteReconciled, updateReconciled } from "@/app/core-logic/contextWL/commentWl/typeAction/commentAck.action";
import { dropCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { createReconciled } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";
import { logger } from "@/app/core-logic/utils/logger";

type ISODate = string;

export type CommentCreatedAckActionPayload = {
	commandId: string;
	commentId: string;
	targetId: string;
	server: { createdAt: ISODate; version: number };
};

export type CommentUpdatedAckActionPayload = {
	commandId: string;
	commentId: string;
	targetId: string;
	server: { editedAt: ISODate; version: number; body?: string };
};

export type CommentDeletedAckActionPayload = {
	commandId: string;
	commentId: string;
	targetId: string;
	server: { deletedAt: ISODate; version: number };
};

// transport events (WS/server)
export const onCommentCreatedAck = createAction<CommentCreatedAckActionPayload>("SERVER/COMMENT/CREATED_ACK");
export const onCommentUpdatedAck = createAction<CommentUpdatedAckActionPayload>("SERVER/COMMENT/UPDATED_ACK");
export const onCommentDeletedAck = createAction<CommentDeletedAckActionPayload>("SERVER/COMMENT/DELETED_ACK");

export const ackListenerFactory = (callback?: () => void) => {
	const mw = createListenerMiddleware<AppStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

	listen({
		actionCreator: onCommentCreatedAck,
		effect: async ({ payload }, api) => {
			const { commandId, commentId, targetId, server } = payload;

			logger.info("[ACK_COMMENTS] created", { commandId, commentId, targetId, version: server.version });

			// ✅ source of truth (guard version in reducer)
			api.dispatch(createReconciled({ commentId, server }));

			// ✅ always drop (idempotent)
			api.dispatch(dropCommitted({ commandId }));

			callback?.();
		},
	});

	listen({
		actionCreator: onCommentUpdatedAck,
		effect: async ({ payload }, api) => {
			const { commandId, commentId, targetId, server } = payload;

			logger.info("[ACK_COMMENTS] updated", { commandId, commentId, targetId, version: server.version });

			api.dispatch(updateReconciled({ commentId, server }));
			api.dispatch(dropCommitted({ commandId }));

			callback?.();
		},
	});

	listen({
		actionCreator: onCommentDeletedAck,
		effect: async ({ payload }, api) => {
			const { commandId, commentId, targetId, server } = payload;

			logger.info("[ACK_COMMENTS] deleted", { commandId, commentId, targetId, version: server.version });

			api.dispatch(deleteReconciled({ commentId, server }));
			api.dispatch(dropCommitted({ commandId }));

			callback?.();
		},
	});

	return mw.middleware;
};
