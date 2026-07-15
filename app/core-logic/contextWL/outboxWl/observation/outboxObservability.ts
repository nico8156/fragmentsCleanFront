import type { OutboxRecord } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { logger } from "@/app/core-logic/utils/logger";

type AckVerdict = "APPLIED" | "REJECTED" | "PENDING";

const commandOf = (record: OutboxRecord | undefined): any => record?.item?.command;

export const outboxTelemetry = {
	enqueuedForSend(record: OutboxRecord) {
		const command = commandOf(record);
		logger.info("[OUTBOX_TRACE] send:start", {
			outboxId: record.id,
			commandId: command?.commandId,
			kind: command?.kind,
			attempts: record.attempts,
		});
	},

	awaitingAck(record: OutboxRecord, nextCheckAt?: string) {
		const command = commandOf(record);
		logger.info("[OUTBOX_TRACE] ack:awaiting", {
			outboxId: record.id,
			commandId: command?.commandId,
			kind: command?.kind,
			nextCheckAt,
		});
	},

	ackCheck(record: OutboxRecord) {
		const command = commandOf(record);
		logger.info("[OUTBOX_TRACE] ack:check", {
			outboxId: record.id,
			commandId: command?.commandId,
			kind: command?.kind,
			attempts: record.attempts,
			nextCheckAt: record.nextCheckAt,
		});
	},

	ackVerdict(record: OutboxRecord, verdict: AckVerdict, details?: Record<string, unknown>) {
		const command = commandOf(record);
		logger.info("[OUTBOX_TRACE] ack:verdict", {
			outboxId: record.id,
			commandId: command?.commandId,
			kind: command?.kind,
			verdict,
			...details,
		});
	},

	reconcile(record: OutboxRecord, projection?: string) {
		const command = commandOf(record);
		logger.info("[OUTBOX_TRACE] reconcile", {
			outboxId: record.id,
			commandId: command?.commandId,
			kind: command?.kind,
			projection,
		});
	},

	rollback(record: OutboxRecord, reason?: string) {
		const command = commandOf(record);
		logger.warn("[OUTBOX_TRACE] rollback", {
			outboxId: record.id,
			commandId: command?.commandId,
			kind: command?.kind,
			reason,
		});
	},

	retryScheduled(record: OutboxRecord, nextAttemptAtMs: number, error: string) {
		const command = commandOf(record);
		logger.warn("[OUTBOX_TRACE] retry:scheduled", {
			outboxId: record.id,
			commandId: command?.commandId,
			kind: command?.kind,
			attempts: record.attempts,
			nextAttemptAtMs,
			error,
		});
	},

	projectionRefreshRequested(input: {
		projection: "likes" | "comments" | "tickets" | "entitlements" | "savedCoffees";
		scope: string;
		entityId?: string | null;
		source: "projectionSync" | "ackReconcile" | "manual";
	}) {
		logger.info("[OUTBOX_TRACE] projection:refresh_requested", input);
	},
};
