import {
    summarizeTicketHistory,
    toTicketHistoryItemVM,
} from "@/app/adapters/secondary/viewModel/useTicketsHistory";
import type {
    ISODate,
    TicketAggregate,
    TicketId,
    TicketStatus,
} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

const ticket = (status: Extract<TicketStatus, "FAILED" | "REJECTED">): TicketAggregate => ({
    ticketId: `ticket-${status.toLowerCase()}` as TicketId,
    status,
    version: 2,
    rejectionReason: status === "FAILED" ? "TECHNICAL_VERIFICATION_FAILURE" : "NOT_A_RECEIPT",
    optimistic: false,
    updatedAt: "2026-09-12T08:00:00Z" as ISODate,
});

describe("ticket history presentation", () => {
    it("keeps technical failures distinct from business rejections", () => {
        const failed = toTicketHistoryItemVM(ticket("FAILED"), {});
        const rejected = toTicketHistoryItemVM(ticket("REJECTED"), {});

        expect(failed).toMatchObject({
            status: "FAILED",
            statusLabel: "Analyse interrompue",
            statusTone: "error",
        });
        expect(rejected).toMatchObject({ status: "REJECTED", statusLabel: "Refusé" });
        expect(summarizeTicketHistory([failed, rejected])).toMatchObject({
            rejectedCount: 1,
            failedCount: 1,
        });
    });
});
