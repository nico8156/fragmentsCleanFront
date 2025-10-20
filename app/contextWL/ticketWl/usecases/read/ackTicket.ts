import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {TicketConfirmedAck, TicketRejectedAck, UserId} from "@/app/contextWL/ticketWl/typeAction/ticket.type";
import {ticketReconciledConfirmed, ticketReconciledRejected} from "@/app/contextWL/ticketWl/reducer/ticketWl.reducer";
import {dropCommitted} from "@/app/contextWL/outboxWl/processOutbox";

// ⚠️ adapte vers ton action réelle qui supprime l’outbox par commandId
export const outboxDropByCommandId = (payload: { commandId: string }) =>
    ({ type: "outbox/dropByCommandId", payload } as const);

// Actions ACK (dispatchées par ton “transport” d’événements serveur)
export const onTicketConfirmedAck = createAction<TicketConfirmedAck>("ticket/ackConfirmed");
export const onTicketRejectedAck = createAction<TicketRejectedAck>("ticket/ackRejected");

export const ackTicketsListenerFactory = () => {
    const lm = createListenerMiddleware();
    const listener = lm.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator: onTicketConfirmedAck,
        effect: async (action, api) => {
            api.dispatch(
                ticketReconciledConfirmed({
                    ticketId: action.payload.ticketId,
                    server: action.payload.server,
                    userId: action.payload.userId as UserId,
                })
            );
            // → entitlements seront gérés dans la prochaine étape (projection)
            api.dispatch(dropCommitted({ commandId: action.payload.commandId }));
        },
    });

    lm.startListening({
        actionCreator: onTicketRejectedAck,
        effect: async (action, api) => {
            api.dispatch(
                ticketReconciledRejected({
                    ticketId: action.payload.ticketId,
                    server: action.payload.server,
                    userId: action.payload.userId as UserId,
                })
            );
            api.dispatch(dropCommitted({ commandId: action.payload.commandId }));
        },
    });
    return lm.middleware;
};
