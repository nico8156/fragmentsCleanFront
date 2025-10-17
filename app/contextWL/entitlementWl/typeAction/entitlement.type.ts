import {ISODate, UserId} from "@/app/contextWL/likeWl/typeAction/likeWl.type";

export type Entitlement = "LIKE" | "COMMENT" | "SUBMIT_CAFE";

export interface UserEntitlements {
    userId: UserId | string;
    confirmedTickets: number;
    rights: Entitlement[]; // ex: ["LIKE", "COMMENT"]
    updatedAt?: ISODate;
}

export interface EnState {
    byUser: Record<string, UserEntitlements>;
}

// Seuils (configurable via DI ou fichier)
export interface EntitlementsThresholds {
    likeAt: number;       // 1
    commentAt: number;    // 3
    submitCafeAt: number; // 5
}
