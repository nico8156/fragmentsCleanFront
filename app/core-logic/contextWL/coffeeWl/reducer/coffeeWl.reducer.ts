import { createAction, createReducer } from "@reduxjs/toolkit";
import { AppStateWl } from "@/app/store/appStateWl";
import { Coffee, CoffeeId, CoffeeStateWl } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { readModelCacheRehydrated } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

export const coffeeRetrieved = createAction<Coffee>("COFFEE/RETRIEVED");
export const coffeesHydrated = createAction<Coffee[]>("COFFEE/HYDRATED_BATCH");

export const coffeeSetLoading = createAction<{ id: CoffeeId | string }>("COFFEE/SET_LOADING");
export const coffeeSetError   = createAction<{ id: CoffeeId | string; message: string }>("COFFEE/SET_ERROR");
export const coffeeListRequested = createAction("COFFEE/LIST_REQUESTED");
export const coffeeListFailed = createAction<{ message: string }>("COFFEE/LIST_FAILED");

const initialState: AppStateWl["coffees"] = {
	byId: {},
	ids: [],
	byCity: {},
	requests: { byId: {}, list: { status: "idle" } },
};

function ensureRequests(state: CoffeeStateWl) {
	state.requests ??= { byId: {}, list: { status: "idle" } };
}

function indexByCity(state: CoffeeStateWl, coffee: Coffee) {
	const city = coffee.address?.city?.toLowerCase();
	if (!city) return;
	state.byCity ??= {};
	const arr = state.byCity[city] ?? [];
	if (!arr.includes(String(coffee.id))) arr.push(String(coffee.id));
	state.byCity[city] = arr;
}

export const coffeeWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
			.addCase(coffeeRetrieved, (state, { payload }) => {
				ensureRequests(state);
				const id = String(payload.id);
				const previous = state.byId[id];
				if (!previous || payload.version >= previous.version) {
					state.byId[id] = { ...(previous ?? {}), ...payload };
					if (!state.ids.includes(id)) state.ids.push(id);
					indexByCity(state, state.byId[id]);
				}
				state.requests.byId[String(payload.id)] = { status: "success" };
			})
			.addCase(coffeesHydrated, (state, { payload }) => {
				ensureRequests(state);
				state.byId = {};
				state.ids = [];
				state.byCity = {};
				for (const coffee of payload) {
					const id = String(coffee.id);
					state.byId[id] = { ...coffee };
					state.ids.push(id);
					indexByCity(state, state.byId[id]);
				}
				state.requests.list = { status: "success" };
			})
			.addCase(coffeeSetLoading, (state, { payload }) => {
				ensureRequests(state);
				state.requests.byId[String(payload.id)] = { status: "loading" };
			})
			.addCase(coffeeSetError, (state, { payload }) => {
				ensureRequests(state);
				state.requests.byId[String(payload.id)] = { status: "error", error: payload.message };
			})
			.addCase(coffeeListRequested, (state) => {
				ensureRequests(state);
				state.requests.list = { status: "loading" };
			})
			.addCase(coffeeListFailed, (state, { payload }) => {
				ensureRequests(state);
				state.requests.list = { status: "error", error: payload.message };
			})
			.addCase(readModelCacheRehydrated, (_state, { payload }) => {
				if (!payload.coffees) return;
				return {
					...payload.coffees,
					requests: payload.coffees.requests ?? { byId: {}, list: { status: "idle" } },
				};
			});
	},
);
