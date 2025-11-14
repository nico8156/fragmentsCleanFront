import {CommandId, commandKinds, ISODate} from "./outbox.type";
import {TicketId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

// ===== Tickets =====
export type TicketVerifyCommand = {
    kind: typeof commandKinds.TicketVerify;
    commandId: CommandId;
    ticketId?: string;               // fixé côté client ou attribué serveur
    imageRef?: string;
    ocrText?: string | null;
    at: ISODate;
};
export type TicketVerifyUndo = {
    kind: typeof commandKinds.TicketVerify;
    ticketId: TicketId | string;                // pour retirer l’agg optimistic
};