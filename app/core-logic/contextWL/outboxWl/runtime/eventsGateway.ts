import { SyncEventsBatch, SyncResponse } from "@/app/core-logic/contextWL/outboxWl/runtime/syncEvents";

export interface SyncEventsGateway {
    replayLocal(): Promise<SyncEventsBatch>;
    syncDelta(params: { cursor: string | null }): Promise<SyncResponse>;
    syncFull(): Promise<SyncResponse>;
}

export class CursorUnknownSyncError extends Error {
    readonly code = "cursorUnknown" as const;
}

export const isCursorUnknownError = (error: unknown): error is CursorUnknownSyncError => {
    return Boolean(error && typeof error === "object" && (error as CursorUnknownSyncError).code === "cursorUnknown");
};
