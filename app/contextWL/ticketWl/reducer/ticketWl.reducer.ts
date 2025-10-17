import {createAction, createReducer, PayloadAction} from "@reduxjs/toolkit";
import {TicketRetrievedPayload, TkState} from "@/app/contextWL/ticketWl/typeAction/ticket.type";

export const ticketRetrieved = createAction<TicketRetrievedPayload>("ticketRetrieved");

const initialState: TkState = { byId: {} };

export const ticketWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(ticketRetrieved, (state, { payload }: PayloadAction<TicketRetrievedPayload>) => {
                const prev = state.byId[payload.ticketId];
                state.byId[payload.ticketId] = {
                    ticketId: payload.ticketId,
                    status: payload.status,
                    version: payload.version,
                    updatedAt: payload.updatedAt,
                    createdAt: prev?.createdAt,
                    ocrText: payload.ocrText ?? prev?.ocrText,
                    amountCents: payload.amountCents ?? prev?.amountCents,
                    currency: payload.currency ?? prev?.currency,
                    ticketDate: payload.ticketDate ?? prev?.ticketDate,
                    rejectionReason: payload.rejectionReason ?? prev?.rejectionReason,
                    loading: "success",
                    error: null,
                    optimistic: false,
                }
            })
    }
)