import type { AppStateWl } from "@/app/store/appStateWl";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { deleteReconciled, updateReconciled } from "@/app/core-logic/contextWL/commentWl/typeAction/commentAck.action";
import { dropCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { createReconciled } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";
import { logger } from "@/app/core-logic/utils/logger";

type ISODate = string;

export const onCommentCreatedAck = createAction<{
	commandId: string;
	commentId: string;
	targetId: string;
	server: { createdAt: ISODate; version: number };
}>("SERVER/COMMENT/CREATED_ACK");

export const onCommentUpdatedAck = createAction<{
	commandId: string;
	commentId: string;
	targetId: string;
	server: { editedAt: ISODate; version: number; body?: string };
}>("SERVER/COMMENT/UPDATED_ACK");

export const onCommentDeletedAck = createAction<{
	commandId: string;
	commentId: string;
	targetId: string;
	server: { deletedAt: ISODate; version: number };
}>("SERVER/COMMENT/DELETED_ACK");

export const ackListenerFactory = () => {
	const mw = createListenerMiddleware<AppStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

	listen({
		actionCreator: onCommentCreatedAck,
		effect: async ({ payload }, api) => {
			const { commandId, commentId, targetId, server } = payload;
			logger.info("[ACK_COMMENTS] created", { commandId, commentId, targetId, version: server.version });

			api.dispatch(createReconciled({ commentId, server }));
			api.dispatch(dropCommitted({ commandId })); // ✅ idempotent
		},
	});

	listen({
		actionCreator: onCommentUpdatedAck,
		effect: async ({ payload }, api) => {
			const { commandId, commentId, targetId, server } = payload;
			logger.info("[ACK_COMMENTS] updated", { commandId, commentId, targetId, version: server.version });

			api.dispatch(updateReconciled({ commentId, server }));
			api.dispatch(dropCommitted({ commandId }));
		},
	});

	listen({
		actionCreator: onCommentDeletedAck,
		effect: async ({ payload }, api) => {
			const { commandId, commentId, targetId, server } = payload;
			logger.info("[ACK_COMMENTS] deleted", { commandId, commentId, targetId, version: server.version });

			api.dispatch(deleteReconciled({ commentId, server }));
			api.dispatch(dropCommitted({ commandId }));
		},
	});

	return mw.middleware;
};

