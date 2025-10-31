import {RootStateWl} from "@/app/store/reduxStoreWl";

const location = (state:RootStateWl) => state.lcState;

export const selectUserCoords = (s: RootStateWl) => s.lcState.coords;
export const selectLocationStatus = (s: RootStateWl) => s.lcState.status;
export const selectLocationPermission = (s: RootStateWl) => s.lcState.permission;
export const selectLocationLastUpdated = (s: RootStateWl) => s.lcState.lastUpdated;