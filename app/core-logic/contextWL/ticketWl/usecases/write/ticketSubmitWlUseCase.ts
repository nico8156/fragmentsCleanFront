import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { ticketOptimisticCreated } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {commandKinds, parseToCommandId} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import {enqueueCommitted, outboxProcessOnce} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {parseToTicketId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {parseToISODate} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

// Action UI (déclenchée depuis le composant)
export const uiTicketSubmitRequested = createAction<{ imageRef?: string; ocrText?: string | null }>(
    "UI/TICKET_SUBMIT_REQUESTED"
);

export const ticketSubmitUseCaseFactory = (deps:DependenciesWl) => {
    const lm = createListenerMiddleware();
    const listen = lm.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: uiTicketSubmitRequested,
        effect: async (action, api) => {
            const { helpers } = deps;
            const at = helpers.nowIso();

            // ✅ ticketId MUST be UUID because backend does UUID.fromString(body.ticketId())
            const ticketId:string = deps.helpers.newTicketIdForTests?.() ?? deps.helpers.newCommandId();

            // ✅ commandId MUST be UUID because backend does UUID.fromString(body.commandId())
            const commandId:string = deps.helpers.getCommandIdForTests?.() ?? deps.helpers.newCommandId();



            // 1) Optimistic UI
            api.dispatch(
                ticketOptimisticCreated({
                    ticketId:parseToTicketId(ticketId),
                    at:parseToISODate(at),
                    status: "ANALYZING",
                    ocrText: action.payload.ocrText ?? undefined,
                    imageRef: action.payload.imageRef,
                })
            );

            // 2) Enqueue outbox command (id outbox = string libre, pas besoin UUID)
            api.dispatch(
                enqueueCommitted({
                    id: `obx_${commandId}`, // ok: juste un id interne outbox
                    item: {
                        command: {
                            kind: commandKinds.TicketVerify,
                            commandId: parseToCommandId(commandId),
                            ticketId,
                            imageRef: action.payload.imageRef,
                            ocrText: action.payload.ocrText ?? null,
                            at: parseToISODate(at),
                        },
                        undo: { kind: commandKinds.TicketVerify, ticketId },
                    },
                    enqueuedAt: at,
                })
            );

            // 3) Dispatch outbox
            api.dispatch(outboxProcessOnce());
        },
    });

    return lm.middleware;
};
