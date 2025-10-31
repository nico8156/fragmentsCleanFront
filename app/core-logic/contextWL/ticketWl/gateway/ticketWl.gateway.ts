import {CommandId, ISODate, TicketId, UserId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

export interface TicketSubmitHelpers {
    nowIso: () => ISODate;
    currentUserId: () => UserId | string;
    newTicketIdForTests?: () => TicketId;     // tests
    getCommandIdForTests?: () => CommandId;   // tests
}
export interface TicketsWlGateway {
    verify(input: {
        commandId: string & { readonly __brand: "CommandId" };
        ticketId: string | undefined;
        imageRef: string | undefined;
        ocrText: string | null;
        at: string & { readonly __brand: "ISODate" }
    }): Promise<void>;
}