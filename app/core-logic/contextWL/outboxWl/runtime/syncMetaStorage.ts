export type SyncMetaState = {
    cursor: string | null;
    lastActiveAt: string | null;
    sessionId: string | null;
    appliedEventIds: string[];
};

export interface SyncMetaStorage {
    load(): Promise<SyncMetaState | null>;
    save(meta: SyncMetaState): Promise<void>;
    clear(): Promise<void>;
}

export const createDefaultSyncMeta = (): SyncMetaState => ({
    cursor: null,
    lastActiveAt: null,
    sessionId: null,
    appliedEventIds: [],
});

export class MemorySyncMetaStorage implements SyncMetaStorage {
    private snapshot: SyncMetaState | null = null;

    async load(): Promise<SyncMetaState | null> {
        return this.snapshot ? { ...this.snapshot, appliedEventIds: [...this.snapshot.appliedEventIds] } : null;
    }

    async save(meta: SyncMetaState): Promise<void> {
        this.snapshot = {
            ...meta,
            appliedEventIds: [...meta.appliedEventIds],
        };
    }

    async clear(): Promise<void> {
        this.snapshot = null;
    }
}

export const createNativeSyncMetaStorage = (key = "app.sync.meta"): SyncMetaStorage => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
        const { MMKV } = require("react-native-mmkv-storage");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const storage = new MMKV.Loader().withInstanceID(key).initialize();
        return {
            async load() {
                const raw = storage.getString("state");
                if (!raw) return null;
                try {
                    const parsed = JSON.parse(raw) as SyncMetaState;
                    return parsed;
                } catch (error) {
                    console.warn("[runtime] invalid sync meta, resetting", error);
                    await storage.removeItem("state");
                    return null;
                }
            },
            async save(meta) {
                storage.setString("state", JSON.stringify(meta));
            },
            async clear() {
                storage.removeItem("state");
            },
        } satisfies SyncMetaStorage;
    } catch (error) {
        console.warn("[runtime] MMKV unavailable, falling back to memory store", error);
        return new MemorySyncMetaStorage();
    }
};
