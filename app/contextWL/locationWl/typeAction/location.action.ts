import {GeoPoint} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {createAction} from "@reduxjs/toolkit";

export const getLocationSuccess = createAction<{ coordinates: GeoPoint }>('PHONE/LOCATION/SUCCESS');
export const userLocationRequested = createAction('PHONE/LOCATION/REQUESTED');