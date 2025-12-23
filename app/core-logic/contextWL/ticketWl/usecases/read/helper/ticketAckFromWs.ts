import { parseToCommandId } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {parseToTicketId, TicketAck} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import type { TicketConfirmedAck, TicketRejectedAck } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import type { TicketVerificationCompletedAck } from "@/app/adapters/primary/socket/ws.type";

type TicketVerificationPayload = {
    userId?: string;
    approved?: {
        amountCents: number;
        currency: string;
        ticketDate: string;
        merchantName?: string;
        merchantAddress?: string;
        paymentMethod?: string;
        lineItems?: Array<{ label: string; quantity?: number; amountCents?: number }>;
    } | null;
    rejected?: {
        reasonCode?: string;
        message?: string;
    } | null;
};

const safeJsonParse = (s?: string): any => {
    if (!s) return null;
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
};

export const mapWsTicketCompletedAck = (
    evt: TicketVerificationCompletedAck
): TicketAck => {
    const payload = safeJsonParse(evt.payloadJson) as TicketVerificationPayload | null;

    if (evt.outcome === "APPROVED") {
        return {
            kind: "TicketConfirmedAck",
            commandId: parseToCommandId(evt.commandId),
            ticketId: parseToTicketId(evt.ticketId) as any,
            userId: payload?.userId ?? "anonymous",
            server: {
                status: "CONFIRMED",
                version: evt.version,
                amountCents: payload?.approved?.amountCents ?? 0,
                currency: payload?.approved?.currency ?? "EUR",
                ticketDate: (payload?.approved?.ticketDate ?? evt.updatedAt) as any,
                updatedAt: evt.updatedAt as any,
                merchantName: payload?.approved?.merchantName,
                merchantAddress: payload?.approved?.merchantAddress,
                paymentMethod: payload?.approved?.paymentMethod,
                lineItems: payload?.approved?.lineItems as any,
            },
        };
    }

    const reason =
        payload?.rejected?.message ??
        payload?.rejected?.reasonCode ??
        evt.outcome;

    return {
        kind: "TicketRejectedAck",
        commandId: parseToCommandId(evt.commandId),
        ticketId: parseToTicketId(evt.ticketId) as any,
        userId: payload?.userId ?? "anonymous",
        server: {
            status: "REJECTED",
            reason,
            version: evt.version,
            updatedAt: evt.updatedAt as any,
            merchantName: payload?.approved?.merchantName ?? undefined,
            merchantAddress: payload?.approved?.merchantAddress ?? undefined,
        },
    };
};
