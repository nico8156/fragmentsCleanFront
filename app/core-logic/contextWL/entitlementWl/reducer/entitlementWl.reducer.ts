import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {
    Entitlement, entitlements,
    EntitlementsThresholds,
} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";
import {
    entitlementsHydrated,
    entitlementsSetThresholds
} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.action";
import {readModelCacheRehydrated} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

const defaultThresholds: EntitlementsThresholds = { likeAt: 1, commentAt: 3, submitCafeAt: 5 };

const initialState: AppStateWl["entitlement"] = {
    byUser:{},
    thresholds: defaultThresholds,
}
// util interne : recalcul des droits
function computeRights(count: number, th: EntitlementsThresholds): Entitlement[] {
    const r: Entitlement[] = [];
    if (count >= th.likeAt) r.push(entitlements.LIKE);
    if (count >= th.commentAt) r.push(entitlements.COMMENT);
    if (count >= th.submitCafeAt) r.push(entitlements.SUBMIT_CAFE);
    return r;
}

export const entitlementWlReducer = createReducer(
    initialState,
    (builder) => {
        builder.addCase(readModelCacheRehydrated, (state, { payload }) => payload.entitlement ?? state)
        builder.addCase(entitlementsSetThresholds, (state, { payload }) => {
            state.thresholds = { ...state.thresholds, ...payload };
            // Optionnel : recalcul global si tu as déjà des users chargés
            for (const uid of Object.keys(state.byUser)) {
                const ue = state.byUser[uid];
                if (ue.rightsSource === "backend") continue;
                ue.rights = computeRights(ue.confirmedTickets, state.thresholds);
                ue.rightsSource = "thresholds";
            }
        })
        // hydration depuis API
        builder.addCase(entitlementsHydrated, (state, { payload }) => {
            const hasPublishedRights = Array.isArray(payload.rights);
            const rights = hasPublishedRights
                ? payload.rights!
                : computeRights(payload.confirmedTickets, state.thresholds);
            state.byUser[String(payload.userId)] = {
                userId: payload.userId,
                confirmedTickets: payload.confirmedTickets,
                publishedComments: payload.publishedComments,
                confirmedLikes: payload.confirmedLikes,
                rights,
                rightsSource: hasPublishedRights ? "backend" : "thresholds",
                updatedAt: payload.updatedAt,
                pass: payload.pass,
            };
        });
    }
)
