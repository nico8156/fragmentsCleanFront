import { createAction } from "@reduxjs/toolkit";
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const outboxRehydrateCommitted = createAction<OutboxStateWl>("OUTBOX/REHYDRATE_COMMITTED");
export const scheduleRetry = createAction<{ id: string; nextAttemptAt: number }>("OUTBOX/SCHEDULE_RETRY");

export const outboxProcessOnce = createAction("OUTBOX/PROCESS_ONCE");
