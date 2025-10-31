import {createAction, createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {Coffee, CoffeeId, CoffeeStateWl} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export const coffeeRetrieved = createAction<Coffee>("COFFEE/RETRIEVED");
export const coffeesHydrated = createAction<Coffee[]>("COFFEE/HYDRATED_BATCH");

export const coffeeSetLoading = createAction<{ id: CoffeeId | string }>("COFFEE/SET_LOADING");
export const coffeeSetError   = createAction<{ id: CoffeeId | string; message: string }>("COFFEE/SET_ERROR");

const initialState: AppStateWl["coffees"] = {
    byId: {},
    ids: [],
    byCity: {},
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
                // upsert
                const prev = state.byId[String(payload.id)];
                state.byId[String(payload.id)] = { ...(prev ?? {}), ...payload };
                indexByCity(state, state.byId[String(payload.id)]);
            })
            .addCase(coffeesHydrated, (state, { payload }) => {
            for (const c of payload) {
                const prev = state.byId[String(c.id)];
                state.byId[String(c.id)] = { ...(prev ?? {}), ...c };
                const prevIds = state.ids;
                if (!prevIds.includes(String(c.id))) state.ids.push(String(c.id));
                indexByCity(state, state.byId[String(c.id)]);
            }})
            .addCase(coffeeSetLoading, (state, { payload }) => {
                const c = state.byId[String(payload.id)];
                if (c) (c as any).loading = "loading";
            })
            .addCase(coffeeSetError, (state, { payload }) => {
                const c = state.byId[String(payload.id)] ?? ({} as any);
                (c as any).loading = "error";
                (c as any).error = payload.message;
                state.byId[String(payload.id)] = c as Coffee;
            })
    }
)