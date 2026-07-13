import { UserId} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

//export type Entitlement = "LIKE" | "COMMENT" | "SUBMIT_CAFE";

export const entitlements = {
    LIKE: "LIKE",
    COMMENT: "COMMENT",
    SUBMIT_CAFE: "SUBMIT_CAFE",
} as const

export type Entitlement = typeof entitlements[keyof typeof entitlements];

export const passLevels = {
    COFFEE_TASTER: "COFFEE_TASTER",
    URBAN_EXPLORER: "URBAN_EXPLORER",
    SOCIAL_BEAN: "SOCIAL_BEAN",
    FRAGMENTS_MASTER: "FRAGMENTS_MASTER",
} as const;

export type PassLevel = typeof passLevels[keyof typeof passLevels];

export const passLevelStatuses = {
    LOCKED: "LOCKED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
} as const;

export type PassLevelStatus = typeof passLevelStatuses[keyof typeof passLevelStatuses];

export type PassCounters = {
    validatedTickets: number;
    publishedComments: number;
    confirmedLikes: number;
};

export type PassRequirements = {
    validatedTickets?: number;
    publishedComments?: number;
    confirmedLikes?: number;
};

export type PassLevelSnapshot = {
    level: PassLevel;
    status: PassLevelStatus;
    requirements: PassRequirements;
    unlockedCapabilities: string[];
};

export type PassProgressSnapshot = {
    currentLevel?: PassLevel;
    counters?: PassCounters;
    levels?: PassLevelSnapshot[];
};

export interface UserEntitlements {
    userId: UserId | string;
    confirmedTickets: number;
    publishedComments?: number;
    confirmedLikes?: number;
    rights: Entitlement[];
    rightsSource?: "backend" | "thresholds";
    updatedAt?: ISODate;
    pass?: PassProgressSnapshot;
}

export type UserEntitlementsSnapshot = Omit<UserEntitlements, "rights" | "rightsSource"> & {
    rights?: Entitlement[];
};

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
