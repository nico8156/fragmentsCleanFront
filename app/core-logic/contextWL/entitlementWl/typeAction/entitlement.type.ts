import { UserId} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { ISODate } from "../../outboxWl/type/outbox.type";

//export type Entitlement = "LIKE" | "COMMENT" | "SUBMIT_CAFE";

export const entitlements = {
    LIKE: "LIKE",
    COMMENT: "COMMENT",
    SUBMIT_CAFE: "SUBMIT_CAFE",
} as const

export type Entitlement = typeof entitlements[keyof typeof entitlements];

export interface UserEntitlements {
    userId: UserId | string;
    confirmedTickets: number;
    rights: Entitlement[];
    updatedAt?: ISODate;
}

export interface EntitlementStateWl {
    byUser: Record<string, UserEntitlements>;
    thresholds: EntitlementsThresholds,
}

// Seuils (configurable via DI ou fichier)
export interface EntitlementsThresholds {
    likeAt: number;       // 1
    commentAt: number;    // 3
    submitCafeAt: number; // 5
}
