import { commandKinds, ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";


export type TargetId = string;   // ex: cafeId / postId
export type UserId = string;

// Agrégat minimal pour l’UI
export type LikeAggregate = {
	targetId: TargetId;
	count: number;        // total likes serveur
	me: boolean;          // l’utilisateur courant a liké ?
	version: number;      // version serveur de l’agrégat
	updatedAt?: ISODate;  // watermark serveur
	optimistic?: boolean; // une action locale en vol ?
	lastFetchedAtMs?: number;

	// ⬇️ NEW: anneau doux autour du coeur
	sync?: {
		state: "pending" | "acked" | "failed";
		commandId: string;
		untilMs: number;
	};
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
		lastFetchedAt?: ISODate;
		staleAfterMs?: number;
	}>;
};
