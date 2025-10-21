import {createAction, createReducer, PayloadAction} from "@reduxjs/toolkit";
import {
    TicketId,
    TicketRetrievedPayload,
    TicketStatus,
    TicketsStateWl,
    ISODate, TicketReconciledConfirmedPayload, TicketReconciledRejectedPayload
} from "@/app/contextWL/ticketWl/typeAction/ticket.type";

export const ticketRetrieved = createAction<TicketRetrievedPayload>("SERVER/TICKET/RETRIEVED");
export const ticketOptimisticCreated = createAction<{ ticketId: TicketId; at: ISODate; status?: TicketStatus; ocrText?: string | null }>('UI/TICKET/CREATE_OPTIMISTIC_TICKET');
export const ticketSetLoading = createAction<{ ticketId: TicketId }>('ticketSetLoading');
export const ticketSetError = createAction<{ ticketId: TicketId; message: string }>('ticketSetError');
export const ticketReconciledConfirmed = createAction<TicketReconciledConfirmedPayload>('SERVER/TICKET/RECONCILED_CONFIRMED');
export const ticketReconciledRejected = createAction<TicketReconciledRejectedPayload>('SERVER/TICKET/RECONCILED_REJECTED');
export const ticketRollBack = createAction<{ticketId: TicketId | string}>('SERVER/TICKET/ROLLBACK_TICKET_RECONCILED_REJECTED');

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
            .addCase(ticketReconciledConfirmed, (state, { payload }: PayloadAction<TicketReconciledConfirmedPayload>) => {
                const { ticketId, server } = payload;
                const prev = state.byId[ticketId] ?? {
                    ticketId,
                    version: 0,
                    createdAt: server.updatedAt,
                };
                state.byId[ticketId] = {
                    ...prev,
                    status: "CONFIRMED",
                    version: server.version,
                    updatedAt: server.updatedAt,
                    amountCents: server.amountCents,
                    currency: server.currency,
                    ticketDate: server.ticketDate,
                    optimistic: false,
                    loading: "success",
                    error: null,
                };
            })
            .addCase(ticketReconciledRejected, (state, { payload }: PayloadAction<TicketReconciledRejectedPayload>) => {
                const { ticketId, server } = payload;
                const prev = state.byId[ticketId] ?? {
                    ticketId,
                    version: 0,
                    createdAt: server.updatedAt,
                };
                state.byId[ticketId] = {
                    ...prev,
                    status: "REJECTED",
                    version: server.version,
                    updatedAt: server.updatedAt,
                    rejectionReason: server.reason,
                    optimistic: false,
                    loading: "success",
                    error: null,
                };
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
            .addCase(ticketRollBack,(state, {payload}) => {
                delete state.byId[payload.ticketId as TicketId];
            })
    }
)