import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {
    locationUpdated,
    permissionUpdated, watchError, watchStarted, watchStopped
} from "@/app/contextWL/locationWl/typeAction/location.action";

const initialState: AppStateWl["location"] = {
    coords: null,
    lastUpdated: null,
    status: 'idle',
    permission: 'undetermined',
    isWatching: false
};

export const locationReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(permissionUpdated,(s, a) => {
                s.permission = a.payload.status ? 'granted' : 'denied'
                if (s.status === 'error' && a.payload.status) s.status = 'idle'
            })
            .addCase(locationUpdated, (s, a) => {
                s.coords = a.payload.coords
                s.lastUpdated = a.payload.at
                s.status = s.isWatching ? 'watching' : 'idle'
                s.error = undefined
            })
            .addCase(watchStarted, (s, a) => {
                s.isWatching = true
                s.status = 'watching'
            })
            .addCase(watchStopped,(s,a)=> {
                s.isWatching = false
                s.status = 'paused'
            })
            .addCase(watchError,(s,a)=> {
                s.status = 'error'
                s.error = a.payload.message
            })
    }
)