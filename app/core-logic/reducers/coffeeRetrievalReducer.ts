import { createReducer } from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {coffeeRetrieved} from "@/app/core-logic/use-cases/coffee-retrieval/retrieveCoffee";

const initialState: AppState["coffeeRetrieval"] = {
    data: null,
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
