import {
    ticketHistoryFailed,
    ticketHistoryReceived,
    ticketHistoryRequested,
} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import type { ISODate, TicketId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { toTicketStatus } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketRetrieval";
import type { AppThunkWl } from "@/app/store/reduxStoreWl";

let inflight: AbortController | undefined;

export const ticketHistoryRetrieval = (
    input: { reset?: boolean } = {},
): AppThunkWl<Promise<void>> => async (dispatch, getState, gateways) => {
    const reset = input.reset !== false;
    const history = getState().tState.history;
    if (history.status === "refreshing" || history.status === "loadingMore") return;
    if (!reset && (history.nextCursor === null || !history.initialized)) return;
    const ticketGateway = gateways?.tickets;
    if (!ticketGateway) {
        dispatch(ticketHistoryFailed({ message: "Service des tickets indisponible." }));
        return;
    }

    if (reset) inflight?.abort();
    const controller = new AbortController();
    inflight = controller;
    dispatch(ticketHistoryRequested({ reset }));

    try {
        const page = await ticketGateway.listHistory({
            cursor: reset ? undefined : history.nextCursor ?? undefined,
            limit: 20,
            signal: controller.signal,
        });
        if (inflight !== controller) return;
        dispatch(ticketHistoryReceived({
            reset,
            items: page.items.flatMap((item) => {
                const status = toTicketStatus(item.status, item.outcome);
                if (status === "DELETED") return [];
                return [{
                    ticketId: item.ticketId as TicketId,
                    status,
                    version: item.version,
                    occurredAt: (item.occurredAt ?? new Date().toISOString()) as ISODate,
                    amountCents: item.amountCents ?? undefined,
                    currency: item.currency ?? undefined,
                    ticketDate: (item.ticketDate ?? undefined) as ISODate | undefined,
                    merchantName: item.merchantName ?? undefined,
                    merchantAddress: item.merchantAddress ?? undefined,
                    rejectionReason: item.rejectionReason ?? undefined,
                }];
            }),
            nextCursor: page.nextCursor ?? null,
        }));
    } catch (error: any) {
        if (error?.name !== "AbortError" && inflight === controller) {
            dispatch(ticketHistoryFailed({ message: error?.message ?? "Historique indisponible." }));
        }
    } finally {
        if (inflight === controller) inflight = undefined;
    }
};
