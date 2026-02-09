import { createAction } from "@reduxjs/toolkit";

export type LikeSyncState = "idle" | "pending" | "acked" | "failed";

export const likeSyncPending = createAction<{
	targetId: string;
	commandId: string;
	ttlMs?: number; // combien de temps max on affiche pending sans ack
}>("LIKE/SYNC_PENDING");

export const likeSyncAcked = createAction<{
	targetId: string;
	commandId: string;
	ttlMs?: number; // combien de temps on affiche le vert
}>("LIKE/SYNC_ACKED");

export const likeSyncFailed = createAction<{
	targetId: string;
	commandId: string;
	ttlMs?: number;
	error?: string;
}>("LIKE/SYNC_FAILED");

export const likeSyncCleared = createAction<{ targetId: string }>("LIKE/SYNC_CLEARED");

