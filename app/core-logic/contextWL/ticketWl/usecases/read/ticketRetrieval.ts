import {ISODate, TicketId, TicketStatus} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {ticketRetrieved, ticketSetError, ticketSetLoading} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {AppThunkWl} from "@/app/store/reduxStoreWl";
import { selectOutboxStatusByTicketId, isOutboxPendingStatus } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { selectNonTerminalTicketIds } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";

const inflight = new Map<string, AbortController>();

const toTicketStatus = (status: string, outcome?: string | null): TicketStatus => {
    const normalizedStatus = status.toUpperCase();
    const normalizedOutcome = outcome?.toUpperCase();

    if (normalizedOutcome === "APPROVED" || normalizedOutcome === "CONFIRMED") return "CONFIRMED";
    if (
        normalizedOutcome === "REJECTED" ||
        normalizedOutcome === "FAILED_FINAL" ||
        normalizedStatus === "REJECTED"
    ) return "REJECTED";
    if (normalizedStatus === "CONFIRMED") return "CONFIRMED";
    if (normalizedStatus === "CAPTURED") return "CAPTURED";
    return "ANALYZING";
};


export const ticketRetrieval =
    (input: {
        ticketId: TicketId | string;
	        __testServer__?: {
	            status: TicketStatus;
	            version: number;
	            updatedAt: ISODate;
	            ocrText?: string | null;
	            amountCents?: number;
	            currency?: string;
	            ticketDate?: ISODate;
	        };
	    }) :AppThunkWl<Promise<void>> =>
        async (dispatch,_, gateways) => {
            const ticketId = input.ticketId as TicketId;
            dispatch(ticketSetLoading({ ticketId }));

            try {
                if (input.__testServer__) {
                    dispatch(
                        ticketRetrieved({
                            ticketId,
                            status: input.__testServer__.status,
                            version: input.__testServer__.version,
                            updatedAt: input.__testServer__.updatedAt,
                            ocrText: input.__testServer__.ocrText,
                            amountCents: input.__testServer__.amountCents,
                            currency: (input.__testServer__.currency as any) ?? "EUR",
                            ticketDate: input.__testServer__.ticketDate,
                        })
                    );
                    return;
                }

                const ticketGateway = gateways?.tickets;
                if (!ticketGateway) {
                    throw new Error("tickets gateway not configured");
                }

                inflight.get(ticketId)?.abort();
                const controller = new AbortController();
                inflight.set(ticketId, controller);

                const res = await ticketGateway.getStatus({
                    ticketId,
                    signal: controller.signal,
                });

                if (inflight.get(ticketId) !== controller) return;

                dispatch(
                    ticketRetrieved({
                        ticketId: res.ticketId as TicketId,
                        status: toTicketStatus(res.status, res.outcome),
                        version: res.version,
                        updatedAt: ((res.updatedAt ?? res.occurredAt ?? new Date().toISOString()) as ISODate),
                        ocrText: res.ocrText ?? undefined,
                        amountCents: res.amountCents ?? undefined,
                        currency: res.currency ?? undefined,
                        ticketDate: (res.ticketDate as ISODate | null | undefined) ?? undefined,
                        merchantName: res.merchantName ?? undefined,
                        merchantAddress: res.merchantAddress ?? undefined,
                        paymentMethod: res.paymentMethod ?? undefined,
                        imageRef: res.imageRef ?? undefined,
                        rejectionReason: res.rejectionReason ?? undefined,
                    })
                );
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                dispatch(ticketSetError({ ticketId, message: e?.message ?? "ticket retrieval failed" }));
            } finally {
                const current = inflight.get(ticketId);
                if (current && !current.signal.aborted) {
                    inflight.delete(ticketId);
                }
	            }
	        };

export const refreshNonTerminalTickets =
    (input?: { includePendingOutbox?: boolean }): AppThunkWl<Promise<void>> =>
        async (dispatch, getState) => {
            const state = getState();
            const ids = selectNonTerminalTicketIds(state);
            if (!ids.length) return;

            const outboxStatusByTicketId = selectOutboxStatusByTicketId(state);
            for (const ticketId of ids) {
                const pendingOutboxStatus = outboxStatusByTicketId[String(ticketId)];
                if (!input?.includePendingOutbox && isOutboxPendingStatus(pendingOutboxStatus)) {
                    continue;
                }
                await dispatch(ticketRetrieval({ ticketId }) as any);
            }
        };
