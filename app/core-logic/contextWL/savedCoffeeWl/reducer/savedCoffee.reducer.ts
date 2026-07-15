import { createReducer } from "@reduxjs/toolkit";

import { readModelCacheRehydrated } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";
import {
	savedCoffeeOptimisticSet,
	savedCoffeeReconciled,
	savedCoffeeRollback,
	savedCoffeesRetrievalFailed,
	savedCoffeesRetrievalPending,
	savedCoffeesRetrieved,
} from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";
import {
	SavedCoffeeItem,
	SavedCoffeeStateWl,
	savedCoffeeLoadingStates,
} from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";

export const initialSavedCoffeeState: SavedCoffeeStateWl = {
	byCoffeeId: {},
	ids: [],
	version: 0,
	loading: savedCoffeeLoadingStates.IDLE,
};

const ensureId = (state: SavedCoffeeStateWl, coffeeId: string) => {
	if (!state.ids.includes(coffeeId)) {
		state.ids.unshift(coffeeId);
	}
};

const removeId = (state: SavedCoffeeStateWl, coffeeId: string) => {
	state.ids = state.ids.filter((id) => id !== coffeeId);
};

const applyServerItems = (state: SavedCoffeeStateWl, items: SavedCoffeeItem[]) => {
	const nextById: Record<string, SavedCoffeeItem> = {};
	const nextIds: string[] = [];

	for (const item of items) {
		const local = state.byCoffeeId[item.coffeeId];
		if (local?.optimistic) {
			nextById[item.coffeeId] = {
				...item,
				...local,
				version: Math.max(item.version, local.version),
			};
		} else {
			nextById[item.coffeeId] = item;
		}
		nextIds.push(item.coffeeId);
	}

	for (const local of Object.values(state.byCoffeeId)) {
		if (local.optimistic && !nextById[local.coffeeId]) {
			nextById[local.coffeeId] = local;
			nextIds.unshift(local.coffeeId);
		}
	}

	state.byCoffeeId = nextById;
	state.ids = Array.from(new Set(nextIds));
};

export const savedCoffeeReducer = createReducer(initialSavedCoffeeState, (builder) => {
	builder.addCase(readModelCacheRehydrated, (state, { payload }) => payload.savedCoffees ?? state);

	builder.addCase(savedCoffeesRetrievalPending, (state) => {
		state.loading = savedCoffeeLoadingStates.PENDING;
		state.error = undefined;
	});

	builder.addCase(savedCoffeesRetrieved, (state, { payload }) => {
		applyServerItems(state, payload.items);
		state.version = Math.max(state.version, payload.version);
		state.loading = savedCoffeeLoadingStates.SUCCESS;
		state.lastFetchedAtMs = Date.now();
		state.error = undefined;
	});

	builder.addCase(savedCoffeesRetrievalFailed, (state, { payload }) => {
		state.loading = savedCoffeeLoadingStates.ERROR;
		state.error = payload.error;
	});

	builder.addCase(savedCoffeeOptimisticSet, (state, { payload }) => {
		if (payload.value) {
			const previous = state.byCoffeeId[payload.coffeeId];
			state.byCoffeeId[payload.coffeeId] = {
				coffeeId: payload.coffeeId,
				name: payload.fallback?.name ?? previous?.name ?? "Café",
				addressLine: payload.fallback?.addressLine ?? previous?.addressLine,
				city: payload.fallback?.city ?? previous?.city,
				postalCode: payload.fallback?.postalCode ?? previous?.postalCode,
				country: payload.fallback?.country ?? previous?.country,
				savedAt: payload.at,
				version: previous?.version ?? 0,
				optimistic: true,
				pendingCommandId: payload.commandId,
			};
			ensureId(state, payload.coffeeId);
			return;
		}

		const item = state.byCoffeeId[payload.coffeeId];
		if (item) {
			item.optimistic = true;
			item.pendingCommandId = payload.commandId;
		}
		delete state.byCoffeeId[payload.coffeeId];
		removeId(state, payload.coffeeId);
	});

	builder.addCase(savedCoffeeReconciled, (state, { payload }) => {
		const item = state.byCoffeeId[payload.coffeeId];
		if (!item) return;
		if (item.pendingCommandId && item.pendingCommandId !== payload.commandId) return;
		item.optimistic = false;
		delete item.pendingCommandId;
	});

	builder.addCase(savedCoffeeRollback, (state, { payload }) => {
		if (payload.prevSaved && payload.prevItem) {
			state.byCoffeeId[payload.coffeeId] = payload.prevItem;
			ensureId(state, payload.coffeeId);
			return;
		}
		delete state.byCoffeeId[payload.coffeeId];
		removeId(state, payload.coffeeId);
	});
});
