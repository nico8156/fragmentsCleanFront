import {createAction, createReducer} from "@reduxjs/toolkit";
import {AppState, Job} from "@/app/store/appState";


export const jobUpserted = createAction<Job>('exchanges/JOB_UPSERTED')
export const jobRemoved = createAction<{correlationKey:string}>('exchanges/JOB_REMOVED')

const initialState: AppState["exchangesByKey"] = {};

export const exchangesReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(jobUpserted, (state, action) => {
                state[action.payload.correlationKey] = action.payload;
            })
            .addCase(jobRemoved, (state, action) => {
                delete state[action.payload.correlationKey];
            })
    }
)

export const selectSentJobs = (s:AppState) => Object.values(s.exchangesByKey).filter(j=>j.status==='sent');