import {createReducer} from "@reduxjs/toolkit";
import {AppRuntimeState, ISODate} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.type";
import {
    appBecameActive,
    appBecameBackground,
    appBecameInactive, appBootFailed, appBootRequested, appBootSucceeded,
    appConnectivityChanged, appHydrationDone, appWarmupDone
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

const initialState: AppRuntimeState = {
    phase: "cold",
    online: true,
    boot: { doneHydration: false, doneWarmup: false },
};

export const appReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(appWarmupDone,(s)=> {
                s.boot.doneWarmup = true
            })
            .addCase(appHydrationDone,(s) => {
                s.boot.doneHydration = true
            })
            .addCase(appBecameActive, (s) => {
                s.phase = s.boot.doneHydration ? "ready" : "booting";
                s.lastActiveAt = new Date().toISOString() as ISODate;
            })
            .addCase(appBecameBackground, (s) => { s.phase = "background"; })
            .addCase(appBecameInactive, (s) => { s.phase = "inactive"; })
            .addCase(appConnectivityChanged, (s, { payload }) => {
                s.online = payload.online;
                if (payload.online) s.lastOnlineAt = new Date().toISOString() as ISODate;
            })
            .addCase(appBootRequested, (s) => { s.phase = "booting"; s.boot.error = null; })
            .addCase(appBootSucceeded, (s) => { s.phase = "ready"; s.boot.error = null; })
            .addCase(appBootFailed, (s, a) => { s.phase = "error"; s.boot.error = a.payload.message; })
    }
)