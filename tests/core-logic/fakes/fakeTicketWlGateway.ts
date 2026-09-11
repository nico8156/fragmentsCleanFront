import { TicketsWlGateway } from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";
import { CommandId, ISODate } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

type VerifyInput = {
    commandId: CommandId;
    ticketId: string | undefined;
    imageRef: string | undefined;
    ocrText: string | null;
    at: ISODate;
};

export class FakeTicketsGateway implements TicketsWlGateway {
    public readonly verifyCalls: VerifyInput[] = [];
    public readonly getStatusCalls: { ticketId: string; signal?: AbortSignal }[] = [];
    public readonly listHistoryCalls: { cursor?: string; limit: number; signal?: AbortSignal }[] = [];
    public shouldFail = false;
    public shouldFailGetStatus = false;
    public nextStatusResponse = {
        ticketId: "ticket-default",
        status: "ANALYZING",
        outcome: null,
        imageRef: null,
        ocrText: null,
        amountCents: null,
        currency: null,
        ticketDate: null,
        merchantName: null,
        merchantAddress: null,
        paymentMethod: null,
        rejectionReason: null,
        version: 1,
        occurredAt: "2026-07-06T10:00:00.000Z",
    };
    public nextHistoryResponse: Awaited<ReturnType<TicketsWlGateway["listHistory"]>> = {
        items: [],
        nextCursor: null,
    };

    async listHistory(input: { cursor?: string; limit: number; signal?: AbortSignal }) {
        this.listHistoryCalls.push(input);
        if (input.signal?.aborted) {
            const e: any = new Error("Aborted");
            e.name = "AbortError";
            throw e;
        }
        if (this.shouldFailGetStatus) throw new Error("FakeTicketsGateway.listHistory failed");
        return this.nextHistoryResponse;
    }

    async getStatus(input: { ticketId: string; signal?: AbortSignal }) {
        this.getStatusCalls.push(input);

        if (input.signal?.aborted) {
            const e: any = new Error("Aborted");
            e.name = "AbortError";
            throw e;
        }

        if (this.shouldFailGetStatus) {
            throw new Error("FakeTicketsGateway.getStatus failed");
        }

        return {
            ...this.nextStatusResponse,
            ticketId: input.ticketId,
        };
    }

    async verify(input: VerifyInput): Promise<void> {
        this.verifyCalls.push(input);

        if (this.shouldFail) {
            throw new Error("FakeTicketsGateway.verify failed");
        }
    }
}
