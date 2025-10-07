import {Coffee} from "@/assets/data/coffee";
import {LikeRoot, LikeState, TargetId} from "@/app/contexts/like/like.type";
import {CommentId, OutboxCommand, TempId, Comment, CommentRoot, OutboxState} from "@/app/contexts/comment/comment.type";


export interface AppState {
    coffeeRetrieval: {
        data : Coffee[] | [];
    },
    likeRetrieval: {
        data : Like[] | [];
    },
    likes: {
        byId: Record<TargetId, LikeState>;
    }
    likeOutbox: LikeCmd[];
    comments: CommentsState,
    commentOutbox: OutboxState;
    authState: AuthState,
    ticketState: {
        byId: Record<string, TicketMeta>;
        ids: string[];
        uploadProgress: Record<string, number>;
        validCount: number;
        validatedIds: Record<string, true>;
    },
    exchangesByKey: Record<string, Job>
}

export interface CommentsState {
    byId: Record<string, Comment>; // key: commentId ou tempId
    //byPostId: Record<string, { ids: string[]; serverCursor?: string; lastServerTime?: string }>;
    idMap: { tempToServer: Record<TempId, CommentId> };
}

export type CommandId = string;

export type LikeCmd = { type: 'Like.Set'; commandId: CommandId; targetId: string; liked: boolean; attempts: number; error?: string };

export type UUID = string;

export type Job = { correlationKey:string; jobId:string; status:'sent'|'failed'|'timeout' };

// export interface Comment {
//     id: string;
//     userId: string;
//     coffeeId: string;
//     content: string;
// }
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
    error: AuthStateError | null; // "PROVIDER_ERROR" | "TOKEN_EXPIRED" | ...
}
export interface AuthStateError {
    step: string;
    message: string;
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

export const STORAGE_KEYS = {
    accessToken: "accessToken",
    refreshToken: "refreshToken",
    accessTokenExpiresAt: "accessTokenExpiresAt",
} as const;

type TicketStatusOCR = "IDLE" | "OCR_RUNNING" | "PENDING_ANALYSIS" | "VERIFIED" | "PARTIAL" | "INVALID" | "FAILED";

type TicketDraft = {
    id: string;                 // correlationId
    photoUri: string;
    rawText?: string;
    ocr: { engine: string; confidence?: number } | null;
    capturedAt: string;         // ISO
    status: TicketStatus;
    issues?: string[];
};

type TicketVerified = {
    id: string;                 // correlationId (ou id serveur)
    merchant_name: string;
    merchant_address?: string;
    merchant_siret?: string;
    purchase_datetime: string;  // ISO
    total_amount: number;
    currency: "EUR";
    vat_amount?: number;
    ticket_number?: string;
    confidence: number;
    status: "VERIFIED" | "PARTIAL";
};
