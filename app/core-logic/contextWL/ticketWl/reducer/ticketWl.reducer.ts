import {createAction, createReducer, PayloadAction} from "@reduxjs/toolkit";
import {
    TicketId,
    TicketRetrievedPayload,
    TicketStatus,
    TicketsStateWl,
    ISODate, TicketReconciledConfirmedPayload, TicketReconciledRejectedPayload, TicketHistoryItemPayload
} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {readModelCacheRehydrated} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

export const ticketRetrieved = createAction<TicketRetrievedPayload>("SERVER/TICKET/RETRIEVED");
export const ticketOptimisticCreated = createAction<{ ticketId: TicketId; at: ISODate; status?: TicketStatus; ocrText?: string | null; imageRef?: string }>('UI/TICKET/CREATE_OPTIMISTIC_TICKET');
export const ticketSetLoading = createAction<{ ticketId: TicketId }>('ticketSetLoading');
export const ticketSetError = createAction<{ ticketId: TicketId; message: string }>('ticketSetError');
export const ticketReconciledConfirmed = createAction<TicketReconciledConfirmedPayload>('SERVER/TICKET/RECONCILED_CONFIRMED');
export const ticketReconciledRejected = createAction<TicketReconciledRejectedPayload>('SERVER/TICKET/RECONCILED_REJECTED');
export const ticketRollBack = createAction<{ticketId: TicketId | string}>('SERVER/TICKET/ROLLBACK_TICKET_RECONCILED_REJECTED');
export const ticketRemoved = createAction<{ ticketId: TicketId }>('SERVER/TICKET/REMOVED');
export const ticketHistoryRequested = createAction<{ reset: boolean }>('SERVER/TICKET_HISTORY/REQUESTED');
export const ticketHistoryReceived = createAction<{
    reset: boolean;
    items: TicketHistoryItemPayload[];
    nextCursor: string | null;
}>('SERVER/TICKET_HISTORY/RECEIVED');
export const ticketHistoryFailed = createAction<{ message: string }>('SERVER/TICKET_HISTORY/FAILED');

const emptyHistory = (): TicketsStateWl["history"] => ({
    ids: [],
    nextCursor: null,
    status: "idle",
    error: null,
    initialized: false,
});
const initialState: TicketsStateWl = { byId: {}, history: emptyHistory() };

export const ticketWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(readModelCacheRehydrated, (state, { payload }) => payload.tickets
                ? { ...payload.tickets, history: payload.tickets.history ?? emptyHistory() }
                : state)
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
                    merchantName: payload.merchantName ?? prev?.merchantName,
                    merchantAddress: payload.merchantAddress ?? prev?.merchantAddress,
                    paymentMethod: payload.paymentMethod ?? prev?.paymentMethod,
                    imageRef: payload.imageRef ?? prev?.imageRef,
                    lineItems: payload.lineItems ?? prev?.lineItems,
                    rejectionReason: payload.rejectionReason ?? prev?.rejectionReason,
                    loading: "success",
                    error: null,
                    optimistic: false,
                }
            })
            .addCase(ticketOptimisticCreated, (state, { payload }: PayloadAction<{ ticketId: TicketId; at: ISODate; status?: TicketStatus; ocrText?: string | null; imageRef?: string }>) => {
                state.byId[payload.ticketId] = {
                    ticketId: payload.ticketId,
                    status: payload.status ?? "ANALYZING", // tu peux mettre "CAPTURED" si tu préfères
                    version: 0,
                    updatedAt: payload.at,
                    createdAt: payload.at,
                    ocrText: payload.ocrText,
                    imageRef: payload.imageRef,
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
                    merchantName: server.merchantName ?? prev.merchantName,
                    merchantAddress: server.merchantAddress ?? prev.merchantAddress,
                    paymentMethod: server.paymentMethod ?? prev.paymentMethod,
                    lineItems: server.lineItems ?? prev.lineItems,
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
                    merchantName: server.merchantName ?? prev.merchantName,
                    merchantAddress: server.merchantAddress ?? prev.merchantAddress,
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
                state.history.ids = state.history.ids.filter((id) => id !== payload.ticketId);
            })
            .addCase(ticketRemoved, (state, { payload }) => {
                delete state.byId[payload.ticketId];
                state.history.ids = state.history.ids.filter((id) => id !== payload.ticketId);
            })
            .addCase(ticketHistoryRequested, (state, { payload }) => {
                state.history.status = payload.reset ? "refreshing" : "loadingMore";
                state.history.error = null;
            })
            .addCase(ticketHistoryReceived, (state, { payload }) => {
                for (const item of payload.items) {
                    const previous = state.byId[item.ticketId];
                    if (previous?.optimistic || (previous && previous.version > item.version)) continue;
                    state.byId[item.ticketId] = {
                        ...previous,
                        ticketId: item.ticketId,
                        status: item.status,
                        version: item.version,
                        updatedAt: item.occurredAt,
                        amountCents: item.amountCents ?? previous?.amountCents,
                        currency: item.currency ?? previous?.currency,
                        ticketDate: item.ticketDate ?? previous?.ticketDate,
                        merchantName: item.merchantName ?? previous?.merchantName,
                        merchantAddress: item.merchantAddress ?? previous?.merchantAddress,
                        rejectionReason: item.rejectionReason ?? previous?.rejectionReason,
                        optimistic: false,
                        loading: "success",
                        error: null,
                    };
                }
                const incomingIds = payload.items.map((item) => item.ticketId);
                state.history.ids = payload.reset
                    ? incomingIds
                    : [...new Set([...state.history.ids, ...incomingIds])];
                state.history.nextCursor = payload.nextCursor;
                state.history.status = "success";
                state.history.error = null;
                state.history.initialized = true;
            })
            .addCase(ticketHistoryFailed, (state, { payload }) => {
                state.history.status = "error";
                state.history.error = payload.message;
                state.history.initialized = true;
            })
    }
)
