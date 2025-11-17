import { createAction } from "@reduxjs/toolkit";
import {SyncEvent} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";

export const replayRequested = createAction("SYNC/REPLAY_REQUESTED");
export const syncDecideRequested = createAction("SYNC/DECIDE_REQUESTED");
export const syncDeltaRequested = createAction("SYNC/DELTA_REQUESTED");
export const syncFullRequested = createAction("SYNC/FULL_REQUESTED");
export const syncEventsReceived = createAction<SyncEvent[]>("SYNC/EVENTS_RECEIVED");