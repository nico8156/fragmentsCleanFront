// likeWl.type.ts
import {commandKinds, ISODate} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";


export type TargetId = string;   // ex: cafeId / postId
export type UserId   = string;

// Agrégat minimal pour l’UI
export type LikeAggregate = {
    targetId: TargetId;
    count: number;        // total likes serveur
    me: boolean;          // l’utilisateur courant a liké ?
    version: number;      // version serveur de l’agrégat
    updatedAt?: ISODate;  // watermark serveur
    optimistic?: boolean; // une action locale en vol ?
};

export type LikeAddCmd = {
    kind: typeof commandKinds.LikeAdd;
    commandId: string;      // idempotence
    targetId: TargetId;
    userId: UserId;
    at: ISODate;            // horodatage client
};

export type LikeRemoveCmd = {
    kind: typeof commandKinds.LikeRemove;
    commandId: string;
    targetId: TargetId;
    userId: UserId;
    at: ISODate;
};

// Undo minimal pour rollback
export type LikeUndo = {
    kind: typeof commandKinds.LikeAdd | typeof commandKinds.LikeRemove;
    targetId: TargetId;
    prevCount: number;
    prevMe: boolean;
    prevVersion?: number;
};

export const loadingStates = {
    IDLE: "idle",
    PENDING: "pending",
    ERROR: "error",
    SUCCESS: "success"
} as const;

export type LoadingState = typeof loadingStates[keyof typeof loadingStates];

export type LikesStateWl = {
    byTarget: Record<TargetId, LikeAggregate & {
        loading: LoadingState;
        error?: string;
    }>;
};
