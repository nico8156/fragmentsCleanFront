import {CommandId, ISODate, TicketId, UserId} from "@/app/contextWL/ticketWl/typeAction/ticket.type";

export interface TicketSubmitHelpers {
    nowIso: () => ISODate;
    currentUserId: () => UserId | string;
    newTicketIdForTests?: () => TicketId;     // tests
    getCommandIdForTests?: () => CommandId;   // tests
}

export interface TicketsGateway {
    // Envoi de la commande de vérification (write). L’ACK arrive via un autre canal.
    verify(input: {
        commandId: CommandId;
        ticketId?: TicketId;     // optionnel si le serveur assigne un id ; dans nos tests on le fixe
        imageRef?: string;
        ocrText?: string | null;
        at: ISODate;
    }): Promise<void>;
}