import { useMemo } from "react";
import { useSelector } from "react-redux";

import { selectSortedTickets } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";
import { TicketAggregate } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { selectOutboxStatusByTicketId } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

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

export type TicketHistorySummaryVM = {
    totalCount: number;
    confirmedCount: number;
    pendingCount: number;
    rejectedCount: number;
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

const isPlausibleBusinessDate = (date: Date) => date.getUTCFullYear() >= 2020;

const formatOptionalDate = (iso?: string) => {
    if (!iso) return undefined;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return undefined;
    if (!isPlausibleBusinessDate(date)) return undefined;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
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
        dateLabel: formatOptionalDate(ticket.ticketDate) ?? formatOptionalDate(ticket.updatedAt) ?? "Date inconnue",
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
    const outboxStatusByTicketId = useSelector(selectOutboxStatusByTicketId);

    const items = useMemo(
        () => tickets.map((ticket) => toVM(ticket, outboxStatusByTicketId)),
        [tickets, outboxStatusByTicketId],
    );

    const recentItems = useMemo(() => items.slice(0, 3), [items]);
    const archivedItems = useMemo(() => items.slice(3), [items]);
    const summary = useMemo<TicketHistorySummaryVM>(
        () => ({
            totalCount: items.length,
            confirmedCount: items.filter((item) => item.statusTone === "success").length,
            pendingCount: items.filter((item) => item.statusTone === "pending").length,
            rejectedCount: items.filter((item) => item.statusTone === "error").length,
        }),
        [items],
    );

    return {
        items,
        recentItems,
        archivedItems,
        archiveCount: archivedItems.length,
        summary,
        isEmpty: items.length === 0,
    } as const;
}
