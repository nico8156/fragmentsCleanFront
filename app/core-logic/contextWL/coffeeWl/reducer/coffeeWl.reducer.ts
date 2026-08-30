import { createAction, createReducer } from "@reduxjs/toolkit";
import { AppStateWl } from "@/app/store/appStateWl";
import { Coffee, CoffeeId, CoffeeStateWl } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { readModelCacheRehydrated } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

export const coffeeRetrieved = createAction<Coffee>("COFFEE/RETRIEVED");
export const coffeesHydrated = createAction<Coffee[]>("COFFEE/HYDRATED_BATCH");

export const coffeeSetLoading = createAction<{ id: CoffeeId | string }>("COFFEE/SET_LOADING");
export const coffeeSetError   = createAction<{ id: CoffeeId | string; message: string }>("COFFEE/SET_ERROR");
export const coffeeListRequested = createAction<{ requestId: string }>("COFFEE/LIST_REQUESTED");
export const coffeeListFailed = createAction<{ requestId: string; message: string }>("COFFEE/LIST_FAILED");
export const coffeeListNotModified = createAction<{ requestId: string; etag?: string; fetchedAt: string }>("COFFEE/LIST_NOT_MODIFIED");
export const coffeeCatalogueReceived = createAction<{ requestId: string; items: Coffee[]; etag?: string; fetchedAt: string }>("COFFEE/CATALOGUE_RECEIVED");
type CoffeeSearchMode = "replace" | "append";
export const coffeeSearchRequested = createAction<{ requestId: string; query: string; mode: CoffeeSearchMode }>("COFFEE/SEARCH_REQUESTED");
export const coffeeSearchReceived = createAction<{ requestId: string; query: string; mode: CoffeeSearchMode; items: Coffee[]; nextCursor?: string; etag?: string }>("COFFEE/SEARCH_RECEIVED");
export const coffeeSearchNotModified = createAction<{ requestId: string; query: string; etag?: string }>("COFFEE/SEARCH_NOT_MODIFIED");
export const coffeeSearchFailed = createAction<{ requestId: string; message: string }>("COFFEE/SEARCH_FAILED");

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
			.addCase(coffeeListRequested, (state, { payload }) => {
				ensureRequests(state);
				state.requests.list = { ...state.requests.list, status: "loading", error: undefined, requestId: payload.requestId };
			})
			.addCase(coffeeListFailed, (state, { payload }) => {
				ensureRequests(state);
				if (state.requests.list.requestId !== payload.requestId) return;
				state.requests.list = { ...state.requests.list, status: "error", error: payload.message };
			})
			.addCase(coffeeListNotModified, (state, { payload }) => {
				ensureRequests(state);
				if (state.requests.list.requestId !== payload.requestId) return;
				state.requests.list = {
					...state.requests.list,
					status: "success",
					etag: payload.etag ?? state.requests.list.etag,
					lastSuccessfulFetch: payload.fetchedAt,
				};
			})
			.addCase(coffeeCatalogueReceived, (state, { payload }) => {
				ensureRequests(state);
				if (state.requests.list.requestId !== payload.requestId) return;
				state.byId = {};
				state.ids = [];
				state.byCity = {};
				for (const coffee of payload.items) {
					const id = String(coffee.id);
					state.byId[id] = { ...coffee };
					state.ids.push(id);
					indexByCity(state, state.byId[id]);
				}
				state.requests.list = {
					status: "success", etag: payload.etag, lastSuccessfulFetch: payload.fetchedAt,
				};
			})
			.addCase(coffeeSearchRequested, (state, { payload }) => {
				ensureRequests(state);
				const preservesCurrentResults = payload.mode === "append" || state.requests.search.query === payload.query;
				state.requests.search = preservesCurrentResults
					? { ...state.requests.search, status: "loading", error: undefined, query: payload.query, requestId: payload.requestId }
					: { status: "loading", ids: [], query: payload.query, requestId: payload.requestId };
			})
			.addCase(coffeeSearchReceived, (state, { payload }) => {
				ensureRequests(state);
				if (state.requests.search.requestId !== payload.requestId || state.requests.search.query !== payload.query) return;
				const ids: string[] = payload.mode === "append" ? [...state.requests.search.ids] : [];
				for (const coffee of payload.items) {
					const id = String(coffee.id);
					const previous = state.byId[id];
					if (!previous || coffee.version >= previous.version) state.byId[id] = coffee;
					if (!ids.includes(id)) ids.push(id);
				}
				state.requests.search = {
					status: "success",
					ids,
					nextCursor: payload.nextCursor,
					etag: payload.etag,
					query: payload.query,
				};
			})
			.addCase(coffeeSearchNotModified, (state, { payload }) => {
				ensureRequests(state);
				if (state.requests.search.requestId !== payload.requestId || state.requests.search.query !== payload.query) return;
				state.requests.search = {
					...state.requests.search, status: "success", etag: payload.etag ?? state.requests.search.etag,
				};
			})
			.addCase(coffeeSearchFailed, (state, { payload }) => {
				ensureRequests(state);
				if (state.requests.search.requestId !== payload.requestId) return;
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
