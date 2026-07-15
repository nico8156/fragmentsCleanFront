import { createSelector } from "@reduxjs/toolkit";

import type { RootStateWl } from "@/app/store/reduxStoreWl";

export const selectSavedCoffeeState = (state: RootStateWl) => state.scState;

export const selectSavedCoffeeItems = createSelector(
	[selectSavedCoffeeState],
	(state) => state.ids.map((id) => state.byCoffeeId[id]).filter(Boolean),
);

export const selectIsCoffeeSaved = (coffeeId?: string | null) =>
	createSelector([selectSavedCoffeeState], (state) =>
		coffeeId ? Boolean(state.byCoffeeId[coffeeId]) : false,
	);

export const selectSavedCoffeeById = (coffeeId?: string | null) =>
	createSelector([selectSavedCoffeeState], (state) =>
		coffeeId ? state.byCoffeeId[coffeeId] : undefined,
	);
