import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import { entitlementsHydrated } from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.action";
import {readModelCacheRehydrated} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

const initialState: AppStateWl["entitlement"] = {
    byUser:{},
}

export const entitlementWlReducer = createReducer(
    initialState,
    (builder) => {
        builder.addCase(readModelCacheRehydrated, (state, { payload }) => payload.entitlement ?? state)
        // hydration depuis API
        builder.addCase(entitlementsHydrated, (state, { payload }) => {
            state.byUser[String(payload.userId)] = {
                userId: payload.userId,
                confirmedTickets: payload.confirmedTickets,
                publishedComments: payload.publishedComments,
                confirmedLikes: payload.confirmedLikes,
                rights: payload.rights ?? [],
                rightsSource: "backend",
                updatedAt: payload.updatedAt,
                pass: payload.pass,
            };
        });
    }
)
