import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {
    Entitlement, entitlements,
    EntitlementsThresholds,
} from "@/app/contextWL/entitlementWl/typeAction/entitlement.type";
import {
    entitlementsHydrated,
    entitlementsSetThresholds
} from "@/app/contextWL/entitlementWl/typeAction/entitlement.action";

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
        builder.addCase(entitlementsSetThresholds, (state, { payload }) => {
            state.thresholds = { ...state.thresholds, ...payload };
            // Optionnel : recalcul global si tu as déjà des users chargés
            for (const uid of Object.keys(state.byUser)) {
                const ue = state.byUser[uid];
                ue.rights = computeRights(ue.confirmedTickets, state.thresholds);
            }
        })
        // hydration depuis API
        builder.addCase(entitlementsHydrated, (state, { payload }) => {
            const rights = computeRights(payload.confirmedTickets, state.thresholds);
            state.byUser[String(payload.userId)] = {
                authorId: payload.userId,
                confirmedTickets: payload.confirmedTickets,
                rights,
                updatedAt: payload.updatedAt,
            };
        });
    }
)