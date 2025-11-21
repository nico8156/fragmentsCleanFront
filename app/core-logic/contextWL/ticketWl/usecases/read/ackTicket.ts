import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppDispatchWl, RootStateWl} from "@/app/store/reduxStoreWl";
import {TicketConfirmedAck, TicketRejectedAck, UserId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {ticketReconciledConfirmed, ticketReconciledRejected} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {dropCommitted} from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { computeBadgeProgressFromState } from "@/app/core-logic/contextWL/userWl/badges/computeBadgeProgress";
import { userBadgeProgressUpdated } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

// Actions ACK (dispatchées par ton “transport” d’événements serveur)
export const onTicketConfirmedAck = createAction<TicketConfirmedAck>("SERVER/TICKET/ON_TICKET_CONFIRMED_ACK");
export const onTicketRejectedAck = createAction<TicketRejectedAck>("SERVER/TICKET/ON_TICKET_REJECTED_ACK");

export const ackTicketsListenerFactory = () => {
    const lm = createListenerMiddleware();
    const listener = lm.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

    listener({
        actionCreator: onTicketConfirmedAck,
        effect: async (action, api) => {
            console.log("[ACK_TICKETS] onTicketConfirmedAck", action.payload);

            api.dispatch(
                ticketReconciledConfirmed({
                    ticketId: action.payload.ticketId,
                    server: action.payload.server,
                    userId: action.payload.userId as UserId,
                })
            );
            api.dispatch(
                userBadgeProgressUpdated({
                    badgeProgress: computeBadgeProgressFromState(api.getState()),
                }),
            );
            api.dispatch(dropCommitted({ commandId: action.payload.commandId }));
        },
    });

    listener({
        actionCreator: onTicketRejectedAck,
        effect: async (action, api) => {
            console.log("[ACK_TICKETS] onTicketRejectedAck", action.payload);

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

