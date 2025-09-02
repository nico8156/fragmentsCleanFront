import { createAction } from "@reduxjs/toolkit";
import {Coffee} from "@/app/store/appState";
import {AppThunk} from "@/app/store/reduxStore";

export const coffeeRetrieved = createAction<Coffee[]>("COFFEE_RETRIEVED");

export const retrieveCoffee =
    (): AppThunk<Promise<void>> =>
        async (dispatch, _, { coffeeGateway }) => {
            const coffee = await coffeeGateway.retrieveCoffee();
            dispatch(coffeeRetrieved(coffee));
        };
