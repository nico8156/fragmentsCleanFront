import type { OutboxItem, OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { createAction } from "@reduxjs/toolkit";

// --- state/snapshot ---
export const outboxRehydrateCommitted =
	createAction<OutboxStateWl>("OUTBOX/REHYDRATE_COMMITTED");

// --- control ---
export const outboxProcessOnce = createAction("OUTBOX/PROCESS_ONCE");
export const outboxSuspendRequested = createAction("OUTBOX/SUSPEND_REQUESTED");
export const outboxResumeRequested = createAction("OUTBOX/RESUME_REQUESTED");

// --- retry scheduling ---
export const scheduleRetry =
	createAction<{ id: string; nextAttemptAtMs: number }>("OUTBOX/SCHEDULE_RETRY");

// --- lifecycle markers ---
export const markProcessing =
	createAction<{ id: string }>("OUTBOX/MARK_PROCESSING");

export const markFailed =
	createAction<{ id: string; error: string }>("OUTBOX/MARK_FAILED");

export const markAwaitingAck =
	createAction<{ id: string; ackByIso: string }>("OUTBOX/MARK_AWAITING_ACK");

// --- queue bookkeeping ---
export const dequeueCommitted =
	createAction<{ id: string }>("OUTBOX/DEQUEUE_COMMITTED");

export const dropCommitted =
	createAction<{ commandId: string }>("OUTBOX/DROP_COMMITTED");

export const enqueueCommitted =
	createAction<{ id: string; item: OutboxItem; enqueuedAt: string }>(
		"OUTBOX/ENQUEUE_COMMITTED",
	);
