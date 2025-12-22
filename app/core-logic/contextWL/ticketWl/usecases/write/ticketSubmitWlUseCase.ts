import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { TicketSubmitHelpers } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { ticketOptimisticCreated } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { AppStateWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

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

            // ✅ ticketId MUST be UUID because backend does UUID.fromString(body.ticketId())
            const ticketId =
                (helpers.newTicketIdForTests?.() ?? (uuidv4() as any)) as any;

            // ✅ commandId MUST be UUID because backend does UUID.fromString(body.commandId())
            const commandId =
                (helpers.getCommandIdForTests?.() ?? (uuidv4() as any)) as any;

            // 1) Optimistic UI
            api.dispatch(
                ticketOptimisticCreated({
                    ticketId,
                    at,
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

            // 3) Dispatch outbox
            api.dispatch(outboxProcessOnce());
        },
    });

    return lm.middleware;
};
