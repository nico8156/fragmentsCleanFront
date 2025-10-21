import {createAction, createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {
    Entitlement,
    EntitlementsThresholds,
    UserEntitlements
} from "@/app/contextWL/entitlementWl/typeAction/entitlement.type";
import {ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";
import {onTicketConfirmedAck} from "@/app/contextWL/ticketWl/usecases/read/ackTicket";

export const entitlementsSetThresholds = createAction<Partial<EntitlementsThresholds>>("SERVER/ENTITLEMENT/SET_THRESHOLDS")
export const entitlementsHydrated = createAction<Partial<UserEntitlements>>('SERVER/ENTITLEMENT/HYDRATED')

const defaultThresholds: EntitlementsThresholds = { likeAt: 1, commentAt: 3, submitCafeAt: 5 };

const initialState: AppStateWl["entitlement"] = {
    byUser:{},
    thresholds: defaultThresholds,
}
// util interne : recalcul des droits
function computeRights(count: number, th: EntitlementsThresholds): Entitlement[] {
    const r: Entitlement[] = [];
    if (count >= th.likeAt) r.push("LIKE");
    if (count >= th.commentAt) r.push("COMMENT");
    if (count >= th.submitCafeAt) r.push("SUBMIT_CAFE");
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
            const rights = Array.isArray(payload.rights)
                ? payload.rights
                : computeRights(payload.confirmedTickets, state.thresholds);
            state.byUser[String(payload.userId)] = {
                userId: payload.userId,
                confirmedTickets: payload.confirmedTickets,
                rights,
                updatedAt: payload.updatedAt,
            };
        });
        // builder.addCase(onTicketConfirmedAck, (state, { payload }) => {
        //     const uid = String(payload.userId);
        //     const ue =
        //         state.byUser[uid] ??
        //         ({ userId: uid, confirmedTickets: 0, rights: [] } as UserEntitlements);
        //
        //     ue.confirmedTickets += 1;
        //     ue.updatedAt = payload.server.updatedAt as ISODate;
        //     ue.rights = computeRights(ue.confirmedTickets, state.thresholds);
        //
        //     state.byUser[uid] = ue;
        // });
    }
)