import {RootStateWl} from "@/app/store/reduxStoreWl";
import {createSelector} from "@reduxjs/toolkit";

export const selectUserCoords = (s: RootStateWl) => s.lcState.coords;
export const selectLocationStatus = (s: RootStateWl) => s.lcState.status;
export const selectLocationPermission = (s: RootStateWl) => s.lcState.permission;
export const selectLocationLastUpdated = (s: RootStateWl) => s.lcState.lastUpdated;
export const selectVisitedCafeIds = (state: RootStateWl): string[] =>
    state.lcState.nearbyHistory.map((v) => v.cafeId);

export const selectNearbyHistory = (state: RootStateWl) =>
    state.lcState.nearbyHistory ?? [];
export const selectVisitedCafesCount = createSelector(
    [selectNearbyHistory],
    (history) => new Set(history.map((v: any) => v.cafeId)).size,
);