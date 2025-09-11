
export interface AppState {
    coffeeRetrieval: {
        data : Coffee[] | [];
    },
    commentRetrieval: {
        data : Comment[] | [];
    },
    likeRetrieval: {
        data : Like[] | [];
    },
    authState: AuthState,
    ticketState: {
        byId: Record<string, TicketMeta>;
        ids: string[];
        uploadProgress: Record<string, number>;
        validCount: number;
        validatedIds: Record<string, true>;
    }
}

export interface Coffee {
    id: string;
    name: string;
}

export interface Comment {
    id: string;
    text: string;
}
export interface Like {
    id: string;
    userId: string;
    coffeeId: string;
}

export type AuthStatus = "anonymous" | "authenticating" | "authenticated" | "error";

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // epoch ms
}

export interface AuthState {
    status: AuthStatus;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    error: string | null; // "PROVIDER_ERROR" | "TOKEN_EXPIRED" | ...
}
export type TicketStatus = "captured"|"uploading"|"pending"|"validated"|"invalid";

export type TicketMeta = {
    ticketId: string;
    status: TicketStatus;
    createdAt: number;
    localUri?: string;   // chemin complet à uploader
    thumbUri?: string;
    remoteId?: string;
    cafeName?: string;
    amountCents?: number;
    ticketDate?: string; // ISO
    invalidReason?: string;
    validatedAt?: number;
};

export type GameProgress = {
    validCount: number;
    validatedIds: Set<string>;
};

export const isDuplicate = (id: string, gp: GameProgress) => gp.validatedIds.has(id);

export const applyValidation = (gp: GameProgress, id: string, valid: boolean): GameProgress => {
    if (!valid || gp.validatedIds.has(id)) return gp;
    const next = new Set(gp.validatedIds);
    next.add(id);
    return { validCount: gp.validCount + 1, validatedIds: next };
};
