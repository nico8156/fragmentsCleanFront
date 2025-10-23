import {createAction} from "@reduxjs/toolkit";

export const appBecameActive     = createAction("APP/BECAME_ACTIVE");
export const appBecameBackground = createAction("APP/BECAME_BACKGROUND");
export const appBecameInactive   = createAction("APP/BECAME_INACTIVE");
export const appConnectivityChanged = createAction<{ online: boolean }>("APP/CONNECTIVITY_CHANGED");

export const appBootRequested = createAction("APP/BOOT_REQUESTED");
export const appBootSucceeded = createAction("APP/BOOT_SUCCEEDED");
export const appBootFailed    = createAction<{ message: string }>("APP/BOOT_FAILED");
export const appHydrationDone = createAction("APP/HYDRATION_DONE");
export const appWarmupDone = createAction<{ message: string }>("APP/WARMUP_DONE");