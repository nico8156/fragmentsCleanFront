import { createReducer } from "@reduxjs/toolkit";
import {AppState, Coffee} from "@/app/store/appState";
import {coffeeRetrieved} from "@/app/core-logic/use-cases/coffee/retrieveCoffee";

const initialState: AppState["coffeeRetrieval"] = {
    data: [] as Coffee[],
};

export const coffeeRetrievalReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(coffeeRetrieved, (_, action) => {
                return { data: action.payload };
            })
    },
);
