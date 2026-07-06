export interface TicketsWlGateway {
    getStatus(input: {
        ticketId: string;
        signal?: AbortSignal;
    }): Promise<{
        ticketId: string;
        status: string;
        outcome?: string | null;
        imageRef?: string | null;
        ocrText?: string | null;
        amountCents?: number | null;
        currency?: string | null;
        ticketDate?: string | null;
        merchantName?: string | null;
        merchantAddress?: string | null;
        paymentMethod?: string | null;
        rejectionReason?: string | null;
        version: number;
        occurredAt?: string | null;
        updatedAt?: string | null;
    }>;

    verify(input: {
        commandId: string & { readonly __brand: "CommandId" };
        ticketId: string | undefined;
        imageRef: string | undefined;
        ocrText: string | null;
        at: string & { readonly __brand: "ISODate" }
    }): Promise<void>;
}
