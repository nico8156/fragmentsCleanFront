import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {getLocationSuccess} from "@/app/contextWL/locationWl/typeAction/location.action";


const intialState:AppStateWl["location"] = {
    lat:0,
    lon:0
}

export const locationReducer = createReducer(
    intialState,
    (builder) => {
        builder
            .addCase(getLocationSuccess, (s, { payload }) => {
                s.lat = payload.coordinates.lat
                s.lon = payload.coordinates.lon;
            })
    }
)