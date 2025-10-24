import { createAction } from "@reduxjs/toolkit";

import {AppThunk} from "@/app/store/reduxStore";
import {CoffeeFromOldServer} from "@/assets/data/coffeeFromOldServer";

export const coffeeRetrieved = createAction<CoffeeFromOldServer[]>("COFFEE_RETRIEVED");

export const retrieveCoffee =
    (): AppThunk<Promise<void>> =>
        async (dispatch, _, { coffeeGateway }) => {
            const coffee = await coffeeGateway.retrieveCoffee();
            dispatch(coffeeRetrieved(coffee));
        };
//TODO prevoir getCoffeesByViewport
