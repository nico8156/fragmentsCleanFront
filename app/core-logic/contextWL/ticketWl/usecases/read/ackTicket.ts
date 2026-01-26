import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { ticketReconciledConfirmed, ticketReconciledRejected } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import type { TicketConfirmedAck, TicketRejectedAck, UserId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

import { computeBadgeProgressFromState } from "@/app/core-logic/contextWL/userWl/badges/computeBadgeProgress";
import { userBadgeProgressUpdated } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import { dropCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { logger } from "@/app/core-logic/utils/logger";

export const onTicketConfirmedAck = createAction<TicketConfirmedAck>("SERVER/TICKET/CONFIRMED_ACK");
export const onTicketRejectedAck = createAction<TicketRejectedAck>("SERVER/TICKET/REJECTED_ACK");

export const ackTicketsListenerFactory = () => {
	const lm = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = lm.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	listen({
		actionCreator: onTicketConfirmedAck,
		effect: async ({ payload }, api) => {
			logger.info("[ACK_TICKETS] confirmed", { commandId: payload.commandId, ticketId: payload.ticketId });

			api.dispatch(ticketReconciledConfirmed({
				ticketId: payload.ticketId,
				server: payload.server,
				userId: payload.userId as UserId,
			}));

			api.dispatch(userBadgeProgressUpdated({
				badgeProgress: computeBadgeProgressFromState(api.getState()),
			}));

			api.dispatch(dropCommitted({ commandId: payload.commandId }));
		},
	});

	listen({
		actionCreator: onTicketRejectedAck,
		effect: async ({ payload }, api) => {
			logger.info("[ACK_TICKETS] rejected", { commandId: payload.commandId, ticketId: payload.ticketId });

			api.dispatch(ticketReconciledRejected({
				ticketId: payload.ticketId,
				server: payload.server,
				userId: payload.userId as UserId,
			}));

			api.dispatch(dropCommitted({ commandId: payload.commandId }));
		},
	});

	return lm.middleware;
};

