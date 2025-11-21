import {GeoPoint} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {createAction} from "@reduxjs/toolkit";
import {LocationCoords} from "@/app/core-logic/contextWL/locationWl/typeAction/location.type";

export const getLocationSuccess = createAction<{ coordinates: GeoPoint }>('PHONE/LOCATION/SUCCESS');
export const userLocationRequested = createAction('PHONE/LOCATION/REQUESTED');


// revision du slice totale !!
//Commands intents
export const permissionCheckRequested = createAction('PHONE/LOCATION/PERMISSION_CHECK_REQUESTED');
export const requestPermission = createAction('PHONE/LOCATION/REQUEST_PERMISSION');
export const getOnceRequested = createAction<{accuracy?: 'low'|'balanced'|'high'}>('PHONE/LOCATION/GET_ONCE_REQUESTED');
export const startWatchRequested = createAction<{accuracy?: 'balanced', distanceInterval?: number, timeInterval?: number}>('PHONE/LOCATION/START_WATCH_REQUESTED');
export const stopWatchRequested = createAction('PHONE/LOCATION/STOP_WATCH_REQUESTED');

//Events facts
export const permissionUpdated = createAction<{ status: 'granted'|'denied'|'undetermined' }>('PHONE/LOCATION/PERMISSION_UPDATED');
export const locationUpdated = createAction<{coords: LocationCoords; at: number }>('PHONE/LOCATION/LOCATION_UPDATED');
export const watchStarted = createAction('PHONE/LOCATION/WATCH_STARTED');
export const watchStopped = createAction('PHONE/LOCATION/WATCH_STOPPED');
export const watchError = createAction<{scope: string; message: string }>('PHONE/LOCATION/WATCH_ERROR');
export const locationNearbyCafeUpdated = createAction<{
    cafeId?: string;
    distanceMeters?: number;
    seenAt: number;
}>("location/nearbyCafeUpdated");