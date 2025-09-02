import {createReducer} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";

const initialState: AppState['userRetrieval'] = {
    data: null,
}

export const userReducer = createReducer(
    initialState,
    (builder) => {
        builder

    }
)