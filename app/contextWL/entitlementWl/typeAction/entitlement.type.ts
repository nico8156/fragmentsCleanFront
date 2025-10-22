import { UserId} from "@/app/contextWL/likeWl/typeAction/likeWl.type";
import { ISODate } from "../../outboxWl/type/outbox.type";

export type Entitlement = "LIKE" | "COMMENT" | "SUBMIT_CAFE";

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
