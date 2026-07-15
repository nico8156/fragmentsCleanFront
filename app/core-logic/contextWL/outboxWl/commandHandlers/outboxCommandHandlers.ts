import { deleteReconciled, updateReconciled } from "@/app/core-logic/contextWL/commentWl/typeAction/commentAck.action";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import { likeRollback } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { likeSyncAcked, likeSyncFailed } from "@/app/core-logic/contextWL/likeWl/typeAction/likeSync.action";
import type { LikeUndo } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { likesRetrieval } from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";
import { savedCoffeeReconciled, savedCoffeeRollback } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";
import { savedCoffeesRetrieval } from "@/app/core-logic/contextWL/savedCoffeeWl/usecases/read/savedCoffeeRetrieval";
import {
	createReconciled,
	createRollback,
	deleteRollback,
	updateRollback,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";
import {
	commandKinds,
	type OutboxCommand,
	type OutboxRecord,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { outboxTelemetry } from "@/app/core-logic/contextWL/outboxWl/observation/outboxObservability";
import { ticketRollBack } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import { ticketRetrieval } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketRetrieval";
import type { GatewaysWl } from "@/app/adapters/primary/wiring/types";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";

type CommandHandlerLogger = {
	warn?: (message: string, payload?: unknown) => void;
};

export const getOutboxCommandGateway = (
	gateways: Partial<GatewaysWl> | undefined,
	kind: string,
) => {
	switch (kind) {
		case commandKinds.LikeAdd:
		case commandKinds.LikeRemove:
			return gateways?.likes;
		case commandKinds.SavedCoffeeSet:
			return gateways?.savedCoffees;
		case commandKinds.CommentCreate:
		case commandKinds.CommentUpdate:
		case commandKinds.CommentDelete:
			return gateways?.comments;
		case commandKinds.TicketVerify:
			return gateways?.tickets;
		default:
			return null;
	}
};

export const sendOutboxCommand = async ({
	command,
	gateway,
}: {
	command: OutboxCommand;
	gateway: any;
}): Promise<"sent" | "unknown"> => {
	switch (command.kind) {
		case commandKinds.LikeAdd:
			await gateway.add({
				commandId: command.commandId,
				targetId: command.targetId,
				at: command.at,
			});
			return "sent";

		case commandKinds.LikeRemove:
			await gateway.remove({
				commandId: command.commandId,
				targetId: command.targetId,
				at: command.at,
			});
			return "sent";

		case commandKinds.CommentCreate:
			await gateway.create({
				commandId: command.commandId,
				targetId: command.targetId,
				parentId: command.parentId ?? null,
				body: command.body,
				tempId: command.tempId,
			});
			return "sent";

		case commandKinds.CommentUpdate:
			await gateway.update({
				commandId: command.commandId,
				commentId: command.commentId,
				body: command.newBody,
				editedAt: command.at,
			});
			return "sent";

		case commandKinds.CommentDelete:
			await gateway.delete({
				commandId: command.commandId,
				commentId: command.commentId,
				deletedAt: command.at,
			});
			return "sent";

		case commandKinds.SavedCoffeeSet:
			await gateway.set({
				commandId: command.commandId,
				savedCoffeeId: command.savedCoffeeId,
				coffeeId: command.coffeeId,
				value: command.value,
				at: command.at,
			});
			return "sent";

		case commandKinds.TicketVerify:
			await gateway.verify({
				commandId: command.commandId,
				ticketId: command.ticketId,
				imageRef: command.imageRef,
				ocrText: command.ocrText ?? null,
				at: command.at,
			});
			return "sent";

		default:
			return "unknown";
	}
};

const isCommentCreateUndo = (
	u: unknown,
): u is { tempId: string; targetId: string; parentId?: string | null } => {
	const x = u as any;
	return !!x && typeof x.tempId === "string" && typeof x.targetId === "string";
};

export const rollbackRejectedOutboxRecord = ({
	record,
	dispatch,
	logger,
	markLikeSyncFailed = false,
}: {
	record: OutboxRecord;
	dispatch: AppDispatchWl;
	logger?: CommandHandlerLogger;
	markLikeSyncFailed?: boolean;
}) => {
	const item = record.item as any;
	const command = item?.command;
	const undo = item?.undo;

	if (!command?.kind) return;

	switch (command.kind) {
		case commandKinds.LikeAdd:
		case commandKinds.LikeRemove: {
			const u = undo as LikeUndo;
			if (!u) return;
			outboxTelemetry.rollback(record, "like command rejected");
			if (markLikeSyncFailed) {
				dispatch(likeSyncFailed({
					targetId: u.targetId,
					commandId: command.commandId,
					error: "rejected",
				}));
			}
			dispatch(likeRollback({
				targetId: u.targetId,
				prevCount: u.prevCount,
				prevMe: u.prevMe,
				prevVersion: u.prevVersion,
			}));
			return;
		}

		case commandKinds.CommentCreate:
			if (isCommentCreateUndo(undo)) {
				outboxTelemetry.rollback(record, "comment create rejected");
				dispatch(createRollback({ tempId: undo.tempId, targetId: undo.targetId, parentId: undo.parentId ?? undefined }));
			} else {
				logger?.warn?.("[OUTBOX] CommentCreate undo shape mismatch", { undo });
			}
			return;

		case commandKinds.CommentUpdate: {
			const u = undo as { commentId: string; prevBody: string; prevVersion?: number };
			if (!u?.commentId) return;
			outboxTelemetry.rollback(record, "comment update rejected");
			dispatch(updateRollback({ commentId: u.commentId, prevBody: u.prevBody, prevVersion: u.prevVersion }));
			return;
		}

		case commandKinds.CommentDelete: {
			const u = undo as { commentId: string; prevBody: string; prevVersion?: number; prevDeletedAt?: string };
			if (!u?.commentId) return;
			outboxTelemetry.rollback(record, "comment delete rejected");
			dispatch(deleteRollback({
				commentId: u.commentId,
				prevBody: u.prevBody,
				prevVersion: u.prevVersion,
				prevDeletedAt: u.prevDeletedAt,
			}));
			return;
		}

		case commandKinds.TicketVerify: {
			const u = undo as { ticketId: string };
			if (!u?.ticketId) return;
			outboxTelemetry.rollback(record, "ticket verify rejected");
			dispatch(ticketRollBack({ ticketId: u.ticketId }));
			return;
		}

		case commandKinds.SavedCoffeeSet: {
			const u = undo as { coffeeId: string; prevSaved: boolean; prevItem?: any };
			if (!u?.coffeeId) return;
			outboxTelemetry.rollback(record, "saved coffee command rejected");
			dispatch(savedCoffeeRollback({
				coffeeId: u.coffeeId,
				prevSaved: u.prevSaved,
				prevItem: u.prevItem,
			}));
			return;
		}

		default:
			return;
	}
};

export const reconcileAppliedOutboxRecord = ({
	record,
	dispatch,
	gateways,
	userId,
}: {
	record: OutboxRecord;
	dispatch: AppDispatchWl;
	gateways: Partial<GatewaysWl> | undefined;
	userId?: string;
}) => {
	const item = record.item as any;
	const command = item?.command;
	const undo = item?.undo;

	if (!command?.kind) return;

	const refreshEntitlements = () => {
		if (!userId || !gateways?.entitlements) return;
		outboxTelemetry.projectionRefreshRequested({
			projection: "entitlements",
			scope: "user",
			entityId: userId,
			source: "ackReconcile",
		});
		dispatch(entitlementsRetrieval({ userId }) as any);
	};

	switch (command.kind) {
		case commandKinds.LikeAdd:
		case commandKinds.LikeRemove:
			outboxTelemetry.reconcile(record, "likes");
			dispatch(likeSyncAcked({
				targetId: command.targetId,
				commandId: command.commandId,
			}));
			if (gateways?.likes && command.targetId) {
				outboxTelemetry.projectionRefreshRequested({
					projection: "likes",
					scope: "target",
					entityId: command.targetId,
					source: "ackReconcile",
				});
				dispatch(likesRetrieval({ targetId: command.targetId }) as any);
			}
			refreshEntitlements();
			return;

		case commandKinds.CommentCreate:
			outboxTelemetry.reconcile(record, "comments");
			if (command.tempId) {
				dispatch(createReconciled({
					commentId: command.tempId,
					server: { createdAt: command.at, version: command.version ?? 0 },
				}));
			}
			refreshEntitlements();
			return;

		case commandKinds.SavedCoffeeSet:
			outboxTelemetry.reconcile(record, "savedCoffees");
			dispatch(savedCoffeeReconciled({
				coffeeId: command.coffeeId,
				commandId: command.commandId,
			}));
			if (gateways?.savedCoffees) {
				outboxTelemetry.projectionRefreshRequested({
					projection: "savedCoffees",
					scope: "user",
					entityId: userId ?? "me",
					source: "ackReconcile",
				});
				dispatch(savedCoffeesRetrieval() as any);
			}
			return;

		case commandKinds.CommentUpdate: {
			outboxTelemetry.reconcile(record, "comments");
			const previousVersion = typeof undo?.prevVersion === "number" ? undo.prevVersion : 0;
			dispatch(updateReconciled({
				commentId: command.commentId,
				server: {
					body: command.newBody,
					editedAt: command.at,
					version: previousVersion + 1,
				},
			}));
			return;
		}

		case commandKinds.CommentDelete: {
			outboxTelemetry.reconcile(record, "comments");
			const previousVersion = typeof undo?.prevVersion === "number" ? undo.prevVersion : 0;
			dispatch(deleteReconciled({
				commentId: command.commentId,
				server: {
					deletedAt: command.at,
					version: previousVersion + 1,
				},
			}));
			return;
		}

		case commandKinds.TicketVerify:
			outboxTelemetry.reconcile(record, "tickets");
			if (command.ticketId && gateways?.tickets) {
				outboxTelemetry.projectionRefreshRequested({
					projection: "tickets",
					scope: "entity",
					entityId: command.ticketId,
					source: "ackReconcile",
				});
				dispatch(ticketRetrieval({ ticketId: command.ticketId }) as any);
			}
			refreshEntitlements();
			return;

		default:
			return;
	}
};
