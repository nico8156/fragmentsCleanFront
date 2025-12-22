// Types de base partagés (tu peux déplacer ça dans un "shared/brand.ts" si tu préfères)
export type ISODate = string & { readonly __brand: "ISODate" };
export type TicketId = string & { readonly __brand: "TicketId" };

export const parseToTicketId = (ticketId: string): TicketId => ticketId as TicketId;

export type UserId = string & { readonly __brand: "UserId" };
export type CommandId = string & { readonly __brand: "CommandId" };

export type CurrencyCode = "EUR" | "USD" | "GBP" | "CHF" | string;

// Statuts côté client (miroir du serveur)
export type TicketStatus = "CAPTURED" | "ANALYZING" | "CONFIRMED" | "REJECTED";

export interface TicketLineItem {
    label: string;
    quantity?: number;
    amountCents?: number;
}

// Agrégat (state local du ticket)
export interface TicketAggregate {
    ticketId: TicketId;
    status: TicketStatus;
    version: number;             // version serveur (pour reconcile)
    updatedAt: ISODate;          // dernière MAJ connue côté client
    createdAt?: ISODate;         // date de création locale (optimistic)
    // Données de contenu (facultatives selon statut)
    ocrText?: string | null;
    amountCents?: number;
    currency?: CurrencyCode;
    ticketDate?: ISODate;
    merchantName?: string;
    merchantAddress?: string;
    paymentMethod?: string;
    imageRef?: string;
    lineItems?: TicketLineItem[];
    rejectionReason?: string;

    // UX
    loading?: "idle" | "loading" | "success" | "error";
    error?: string | null;
    optimistic?: boolean;        // true tant qu'on attend l'ACK
}

// Slice tickets
export interface TicketsStateWl {
    byId: Record<TicketId, TicketAggregate>;
}

// Payloads des actions principales
export interface TicketRetrievedPayload {
    ticketId: TicketId;
    status: TicketStatus;
    version: number;
    updatedAt: ISODate;
    ocrText?: string | null;
    amountCents?: number;
    currency?: CurrencyCode;
    ticketDate?: ISODate;
    merchantName?: string;
    merchantAddress?: string;
    paymentMethod?: string;
    imageRef?: string;
    lineItems?: TicketLineItem[];
    rejectionReason?: string;
}


export interface TicketReconciledConfirmedPayload {
    ticketId: TicketId;
    server: {
        status: "CONFIRMED";
        version: number;
        amountCents: number;
        currency: CurrencyCode;
        ticketDate: ISODate;
        updatedAt: ISODate;
        merchantName?: string;
        merchantAddress?: string;
        paymentMethod?: string;
        lineItems?: TicketLineItem[];
    };
    userId: UserId; // nécessaire pour alimenter les entitlements
}

export interface TicketReconciledRejectedPayload {
    ticketId: TicketId;
    server: {
        status: "REJECTED";
        reason: string;
        version: number;
        updatedAt: ISODate;
        merchantName?: string;
        merchantAddress?: string;
    };
    userId: UserId;
}

// Helpers/Deps pour le listener de submit
export interface TicketSubmitHelpers {
    nowIso: () => ISODate;
    currentUserId: () => UserId | string;
    newTicketIdForTests?: () => TicketId;     // tests
    getCommandIdForTests?: () => CommandId;   // tests
}


export interface TicketConfirmedAck {
    kind: "TicketConfirmedAck";
    commandId: CommandId;
    ticketId: TicketId;
    userId: UserId | string;
    server: {
        status: "CONFIRMED";
        version: number;
        amountCents: number;
        currency: string;
        ticketDate: ISODate;
        updatedAt: ISODate;
        merchantName?: string;
        merchantAddress?: string;
        paymentMethod?: string;
        lineItems?: TicketLineItem[];
    };
}
export interface TicketRejectedAck {
    kind: "TicketRejectedAck";
    commandId: CommandId;
    ticketId: TicketId;
    userId: UserId | string;
    server: {
        status: "REJECTED";
        reason: string;
        version: number;
        updatedAt: ISODate;
        merchantName?: string;
        merchantAddress?: string;
    };
}

export type TicketAck = TicketConfirmedAck | TicketRejectedAck;