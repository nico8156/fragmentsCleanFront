import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {
    locationNearbyCafeUpdated,
    locationUpdated,
    permissionUpdated, watchError, watchStarted, watchStopped
} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";

const initialState: AppStateWl["location"] = {
    coords: null,
    lastUpdated: null,
    status: 'idle',
    permission: 'undetermined',
    isWatching: false,
    nearbyHistory: [],
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
            .addCase(locationNearbyCafeUpdated, (state, { payload }) => {
                state.nearbyCafeId = payload.cafeId;
                state.nearbyDistanceMeters = payload.distanceMeters;
                if (!payload.cafeId) return;

                const existing = state.nearbyHistory.find(
                    (v) => v.cafeId === payload.cafeId,
                );

                if (!existing) {
                    state.nearbyHistory.push({
                        cafeId: payload.cafeId,
                        firstSeenAt: payload.seenAt,
                        lastSeenAt: payload.seenAt,
                        count: 1,
                    });
                } else {
                    existing.lastSeenAt = payload.seenAt;
                    existing.count += 1;
                }

                // optionnel : garder l’historique raisonnable
                const MAX_HISTORY = 100;
                if (state.nearbyHistory.length > MAX_HISTORY) {
                    state.nearbyHistory.splice(0, state.nearbyHistory.length - MAX_HISTORY);
                }
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