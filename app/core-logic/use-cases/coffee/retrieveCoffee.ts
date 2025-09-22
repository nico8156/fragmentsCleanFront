import { createAction } from "@reduxjs/toolkit";

import {AppThunk} from "@/app/store/reduxStore";
import {Coffee} from "@/assets/data/coffee";

export const coffeeRetrieved = createAction<Coffee[]>("COFFEE_RETRIEVED");

export const retrieveCoffee =
    (): AppThunk<Promise<void>> =>
        async (dispatch, _, { coffeeGateway }) => {
            const coffee = await coffeeGateway.retrieveCoffee();
            dispatch(coffeeRetrieved(coffee));
        };
//TODO prevoir getCoffeesByViewport
