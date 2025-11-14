import { createAction } from "@reduxjs/toolkit";

export const replayRequested = createAction("SYNC/REPLAY_REQUESTED");
export const syncDecideRequested = createAction("SYNC/DECIDE_REQUESTED");
export const syncDeltaRequested = createAction("SYNC/DELTA_REQUESTED");
export const syncFullRequested = createAction("SYNC/FULL_REQUESTED");
