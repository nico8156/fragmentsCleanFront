import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
// ⚠️ adapte ce chemin vers TON action outbox existante
import {enqueueCommitted} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {TicketSubmitHelpers} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {ticketOptimisticCreated} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {commandKinds} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {AppStateWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {outboxProcessOnce} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

// Action UI (déclenchée depuis le composant)
export const uiTicketSubmitRequested = createAction<{ imageRef?: string; ocrText?: string | null }>(
    "UI/TICKET_SUBMIT_REQUESTED"
);

export const ticketSubmitUseCaseFactory = (deps: {
    gateways: { tickets: { verify: (i: any) => Promise<void> } };
    helpers: TicketSubmitHelpers;
}) => {
    const lm = createListenerMiddleware();
    const listen = lm.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: uiTicketSubmitRequested,
        effect: async (action, api) => {
            const { helpers } = deps;
            const at = helpers.nowIso();
            const ticketId = (helpers.newTicketIdForTests?.() ?? (`tk_${Math.random().toString(36).slice(2)}`)) as any;
            const commandId = (helpers.getCommandIdForTests?.() ?? (`cmd_${Date.now()}`)) as any;

            // 1) Créer l’agg local en optimistic
            api.dispatch(
                ticketOptimisticCreated({
                    ticketId,
                    at,
                    status: "ANALYZING",
                    ocrText: action.payload.ocrText ?? undefined,
                    imageRef: action.payload.imageRef,
                })
            );

            // 2) Enqueue outbox (commande TicketVerify)
            api.dispatch(
                enqueueCommitted({
                    id: `obx_${commandId}`,
                    item: {
                        command: {
                            kind: commandKinds.TicketVerify,
                            commandId,
                            ticketId,
                            imageRef: action.payload.imageRef,
                            ocrText: action.payload.ocrText ?? null,
                            at,
                        },
                        undo: { kind: commandKinds.TicketVerify, ticketId },
                    },
                    enqueuedAt: at,
                })
            );
            api.dispatch(outboxProcessOnce());
        },
    });

    return lm.middleware;
};
