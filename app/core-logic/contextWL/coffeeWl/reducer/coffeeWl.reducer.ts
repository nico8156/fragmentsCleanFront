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
export const coffeeListNotModified = createAction<{ etag?: string; fetchedAt: string }>("COFFEE/LIST_NOT_MODIFIED");
export const coffeeListMetadataReceived = createAction<{ etag?: string; fetchedAt: string }>("COFFEE/LIST_METADATA_RECEIVED");
export const coffeeSearchRequested = createAction("COFFEE/SEARCH_REQUESTED");
export const coffeeSearchReceived = createAction<{ items: Coffee[]; nextCursor?: string; etag?: string }>("COFFEE/SEARCH_RECEIVED");
export const coffeeSearchFailed = createAction<{ message: string }>("COFFEE/SEARCH_FAILED");

const initialState: AppStateWl["coffees"] = {
	byId: {},
	ids: [],
	byCity: {},
	requests: { byId: {}, list: { status: "idle" }, search: { status: "idle", ids: [] } },
};

function ensureRequests(state: CoffeeStateWl) {
	state.requests ??= { byId: {}, list: { status: "idle" }, search: { status: "idle", ids: [] } };
	state.requests.search ??= { status: "idle", ids: [] };
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
				state.requests.list = { ...state.requests.list, status: "loading", error: undefined };
			})
			.addCase(coffeeListFailed, (state, { payload }) => {
				ensureRequests(state);
				state.requests.list = { ...state.requests.list, status: "error", error: payload.message };
			})
			.addCase(coffeeListNotModified, (state, { payload }) => {
				ensureRequests(state);
				state.requests.list = {
					...state.requests.list,
					status: "success",
					etag: payload.etag ?? state.requests.list.etag,
					lastSuccessfulFetch: payload.fetchedAt,
				};
			})
			.addCase(coffeeListMetadataReceived, (state, { payload }) => {
				ensureRequests(state);
				state.requests.list = {
					status: "success",
					etag: payload.etag,
					lastSuccessfulFetch: payload.fetchedAt,
				};
			})
			.addCase(coffeeSearchRequested, (state) => {
				ensureRequests(state);
				state.requests.search = { ...state.requests.search, status: "loading", error: undefined };
			})
			.addCase(coffeeSearchReceived, (state, { payload }) => {
				ensureRequests(state);
				const ids: string[] = [];
				for (const coffee of payload.items) {
					const id = String(coffee.id);
					const previous = state.byId[id];
					if (!previous || coffee.version >= previous.version) state.byId[id] = coffee;
					ids.push(id);
				}
				state.requests.search = {
					status: "success",
					ids,
					nextCursor: payload.nextCursor,
					etag: payload.etag,
				};
			})
			.addCase(coffeeSearchFailed, (state, { payload }) => {
				ensureRequests(state);
				state.requests.search = { ...state.requests.search, status: "error", error: payload.message };
			})
			.addCase(readModelCacheRehydrated, (_state, { payload }) => {
				if (!payload.coffees) return;
				return {
					...payload.coffees,
					requests: {
						byId: payload.coffees.requests?.byId ?? {},
						list: payload.coffees.requests?.list ?? { status: "idle" },
						search: payload.coffees.requests?.search ?? { status: "idle", ids: [] },
					},
				};
			});
	},
);
