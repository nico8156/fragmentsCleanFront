import {ISODate, TicketId, TicketStatus} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {ticketRetrieved, ticketSetError, ticketSetLoading} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {AppThunkWl} from "@/app/store/reduxStoreWl";


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

                // Exemple si tu ajoutes un gateway read:
                // const res = await dependencies.gateways.tickets.get({ ticketId });
                // dispatch(ticketRetrieved({...map res...}));

                // Sans gateway → success no-op
                dispatch(
                    ticketRetrieved({
                        ticketId,
                        status: "ANALYZING",
                        version: 1,
                        updatedAt: (new Date().toISOString() as ISODate),
                    })
                );
            } catch (e: any) {
                dispatch(ticketSetError({ ticketId, message: e?.message ?? "ticket retrieval failed" }));
            }
        };
