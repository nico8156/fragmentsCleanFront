import {createAction, createReducer, PayloadAction} from "@reduxjs/toolkit";
import {
    TicketId,
    TicketRetrievedPayload,
    TicketStatus,
    TicketsStateWl,
    ISODate
} from "@/app/contextWL/ticketWl/typeAction/ticket.type";

export const ticketRetrieved = createAction<TicketRetrievedPayload>("ticketRetrieved");
export const ticketOptimisticCreated = createAction<{ ticketId: TicketId; at: ISODate; status?: TicketStatus; ocrText?: string | null }>('ticketOptimisticCreated');
export const ticketSetLoading = createAction<{ ticketId: TicketId }>('ticketSetLoading');
export const ticketSetError = createAction<{ ticketId: TicketId; message: string }>('ticketSetError');

const initialState: TicketsStateWl = { byId: {} };

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
            .addCase(ticketOptimisticCreated, (state, { payload }: PayloadAction<{ ticketId: TicketId; at: ISODate; status?: TicketStatus; ocrText?: string | null }>) => {
                state.byId[payload.ticketId] = {
                    ticketId: payload.ticketId,
                    status: payload.status ?? "ANALYZING", // tu peux mettre "CAPTURED" si tu préfères
                    version: 0,
                    updatedAt: payload.at,
                    createdAt: payload.at,
                    ocrText: payload.ocrText,
                    loading: "success",
                    error: null,
                    optimistic: true,
                }
            })
            .addCase(ticketSetLoading, (state, { payload }: PayloadAction<{ ticketId: TicketId }>) => {
                const t = state.byId[payload.ticketId];
                if (t) t.loading = "loading";
            })
            .addCase(ticketSetError, (state, { payload }: PayloadAction<{ ticketId: TicketId; message: string }>) => {
                const t = state.byId[payload.ticketId];
                if (t) {
                    t.loading = "error";
                    t.error = payload.message;
                }
            })
    }
)