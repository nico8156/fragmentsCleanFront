import { useMemo } from "react";
import { useSelector } from "react-redux";

import { selectSortedTickets } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";
import { TicketAggregate } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { commandKinds, statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { RootStateWl } from "@/app/store/reduxStoreWl";

export type TicketHistoryItemVM = {
    id: string;
    merchantName: string;
    amountLabel?: string;
    dateLabel: string;
    statusLabel: string;
    statusTone: "pending" | "success" | "error";
    rejectionReason?: string;
    lineItems?: TicketAggregate["lineItems"];
    paymentMethod?: string;
    currency?: string;
    transportStatus: "pending" | "success" | "failed";
};

const statusCopy: Record<TicketAggregate["status"], { label: string; tone: TicketHistoryItemVM["statusTone"] }> = {
    CAPTURED: { label: "Capturé", tone: "pending" },
    ANALYZING: { label: "Analyse en cours", tone: "pending" },
    CONFIRMED: { label: "Validé", tone: "success" },
    REJECTED: { label: "Refusé", tone: "error" },
};

const formatAmount = (amountCents?: number, currency?: string) => {
    if (typeof amountCents !== "number") return undefined;
    try {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency ?? "EUR",
            minimumFractionDigits: 2,
        }).format(amountCents / 100);
    } catch {
        return `${(amountCents / 100).toFixed(2)} ${currency ?? "EUR"}`;
    }
};

const formatDate = (iso?: string) => {
    if (!iso) return "Date inconnue";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Date inconnue";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const buildOutboxStatusIndex = (state: RootStateWl["oState"]) => {
    const records = state?.byId ?? {};
    const index: Record<string, (typeof statusTypes)[keyof typeof statusTypes]> = {};
    Object.values(records).forEach((record: any) => {
        const command = record?.item?.command;
        if (!command) return;
        if (command.kind === commandKinds.TicketVerify) {
            index[command.ticketId] = record.status;
        }
    });
    return index;
};

const toVM = (
    ticket: TicketAggregate,
    outboxStatusByTicketId: Record<string, (typeof statusTypes)[keyof typeof statusTypes]>,
): TicketHistoryItemVM => {
    const meta = statusCopy[ticket.status] ?? statusCopy.ANALYZING;
    const transportStatus: TicketHistoryItemVM["transportStatus"] = ticket.optimistic
        ? outboxStatusByTicketId[ticket.ticketId] === statusTypes.failed
            ? "failed"
            : "pending"
        : "success";
    return {
        id: ticket.ticketId,
        merchantName: ticket.merchantName ?? "Ticket scanné",
        amountLabel: formatAmount(ticket.amountCents, ticket.currency),
        dateLabel: formatDate(ticket.ticketDate ?? ticket.updatedAt),
        statusLabel: meta.label,
        statusTone: meta.tone,
        rejectionReason: ticket.rejectionReason ?? undefined,
        lineItems: ticket.lineItems,
        paymentMethod: ticket.paymentMethod,
        transportStatus,
    };
};

export function useTicketsHistory() {
    const tickets = useSelector(selectSortedTickets);
    const outboxState = useSelector((state: RootStateWl) => state.oState);

    const outboxStatusByTicketId = useMemo(() => buildOutboxStatusIndex(outboxState), [outboxState]);

    const items = useMemo(
        () => tickets.map((ticket) => toVM(ticket, outboxStatusByTicketId)),
        [tickets, outboxStatusByTicketId],
    );

    return {
        items,
        isEmpty: items.length === 0,
    } as const;
}
