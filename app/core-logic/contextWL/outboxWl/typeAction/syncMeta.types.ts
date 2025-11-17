export type SyncMetaState = {
    schemaVersion: number;
    cursor?: string;
    lastActiveAt: number;
    sessionId?: string;
    appliedEventIds: string[];
};

export interface SyncMetaStorage {
    loadOrDefault(): Promise<SyncMetaState>;
    getSnapshot(): SyncMetaState;
    setCursor(cursor?: string | null): Promise<void>;
    updateLastActiveAt(timestamp: number): Promise<void>;
    setSessionId(sessionId?: string | null): Promise<void>;
    hasEventBeenApplied(eventId: string): boolean;
    markEventApplied(eventId: string): Promise<void>;
    markEventsApplied(eventIds: string[], maxSize?: number): Promise<void>;
    clear(): Promise<void>;
}

export const SCHEMA_VERSION = 1;

export const createDefaultSyncMetaState = (): SyncMetaState => ({
    schemaVersion: SCHEMA_VERSION,
    cursor: undefined,
    lastActiveAt: 0,
    sessionId: undefined,
    appliedEventIds: [],
});
