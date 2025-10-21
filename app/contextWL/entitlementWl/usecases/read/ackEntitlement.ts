// app/contextWL/entitlementWl/usecases/read/ackEntitlements.ts
import { createListenerMiddleware } from "@reduxjs/toolkit";
import {onTicketConfirmedAck} from "@/app/contextWL/ticketWl/usecases/read/ackTicket";
import {entitlementsHydrated} from "@/app/contextWL/entitlementWl/reducer/entitlementWl.reducer";

export const ackEntitlementsListener = () => {
    const lm = createListenerMiddleware();
    const listener = lm.startListening;
    listener({
        actionCreator: onTicketConfirmedAck,
        effect: async (action, api) => {
            const state: any = api.getState();
            const th = state.enState?.thresholds ?? { likeAt: 1, commentAt: 3, submitCafeAt: 5 };
            const userId = String(action.payload.userId);

            const prev = state.enState?.byUser?.[userId];
            console.log("prev in listener : ", prev);
            const confirmedTickets = (prev?.confirmedTickets ?? 0) + 1;

            // hydrate remplace/merge (on l’utilise aussi comme “upsert” simple)
            api.dispatch(
                entitlementsHydrated({
                    userId,
                    confirmedTickets,
                    //rights: [], // sera recalculé par reducer si tu gardes compute dans reducer
                    updatedAt: action.payload.server.updatedAt,
                })
            );
        },
    });
    return lm.middleware;
};
