export interface TicketsWlGateway {
    verify(input: {
        commandId: string & { readonly __brand: "CommandId" };
        ticketId: string | undefined;
        imageRef: string | undefined;
        ocrText: string | null;
        at: string & { readonly __brand: "ISODate" }
    }): Promise<void>;
}