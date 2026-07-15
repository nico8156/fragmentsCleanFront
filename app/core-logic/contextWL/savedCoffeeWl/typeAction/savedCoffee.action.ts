import { createAction } from "@reduxjs/toolkit";

import type { SavedCoffeeItem } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";

export const savedCoffeesRetrievalPending = createAction("SAVED_COFFEES/RETRIEVAL_PENDING");

export const savedCoffeesRetrieved = createAction<{
	items: SavedCoffeeItem[];
	version: number;
	serverTime?: string;
}>("SAVED_COFFEES/RETRIEVED");

export const savedCoffeesRetrievalFailed = createAction<{ error: string }>(
	"SAVED_COFFEES/RETRIEVAL_FAILED",
);

export const savedCoffeeOptimisticSet = createAction<{
	coffeeId: string;
	value: boolean;
	commandId: string;
	at: string;
	fallback?: Partial<SavedCoffeeItem>;
}>("SAVED_COFFEE/OPTIMISTIC_SET");

export const savedCoffeeReconciled = createAction<{ coffeeId: string; commandId: string }>(
	"SAVED_COFFEE/RECONCILED",
);

export const savedCoffeeRollback = createAction<{
	coffeeId: string;
	prevSaved: boolean;
	prevItem?: SavedCoffeeItem;
}>("SAVED_COFFEE/ROLLBACK");
