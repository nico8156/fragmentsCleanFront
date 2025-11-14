import { createAction } from "@reduxjs/toolkit";
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const outboxRehydrateCommitted = createAction<OutboxStateWl>("OUTBOX/REHYDRATE_COMMITTED");
