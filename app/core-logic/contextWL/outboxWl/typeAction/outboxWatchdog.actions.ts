import { createAction } from "@reduxjs/toolkit";

export const outboxAwaitingAckAdded = createAction<{ id: string }>("OUTBOX/AWAITING_ACK_ADDED");
export const outboxWatchdogTick = createAction("OUTBOX/WATCHDOG_TICK");
