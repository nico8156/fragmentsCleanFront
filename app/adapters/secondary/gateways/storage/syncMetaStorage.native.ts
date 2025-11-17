import {PersistedState, StorageDriver} from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxPersistence.types";
import {
    SCHEMA_VERSION,
    SyncMetaState,
    SyncMetaStorage
} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncMeta.types";

class MemoryDriver implements StorageDriver {
    private snapshot: PersistedState | null = null;

    async load() {
        return this.snapshot ? { ...this.snapshot, appliedEventIds: [...this.snapshot.appliedEventIds] } : null;
    }

    async save(state: PersistedState) {
        this.snapshot = { ...state, appliedEventIds: [...state.appliedEventIds] };
    }

    async clear() {
        this.snapshot = null;
    }
}

const parseState = (raw: string | null): PersistedState | null => {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as PersistedState;
    } catch (error) {
        console.warn("[sync] invalid persisted meta, resetting", error);
        return null;
    }
};

const createAsyncStorageDriver = (key: string): StorageDriver | null => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require("@react-native-async-storage/async-storage");
        const storage = AsyncStorage.default ?? AsyncStorage;
        if (!storage) return null;
        return {
            async load() {
                const raw = await storage.getItem(key);
                return parseState(raw);
            },
            async save(state) {
                await storage.setItem(key, JSON.stringify(state));
            },
            async clear() {
                await storage.removeItem(key);
            },
        } satisfies StorageDriver;
    } catch (error) {
        console.warn("[sync] AsyncStorage unavailable", error);
        return null;
    }
};

const createMmkvDriver = (key: string): StorageDriver | null => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
        const { MMKVLoader } = require("react-native-mmkv-storage");
        const storage = new MMKVLoader().withInstanceID(key).initialize();
        return {
            async load() {
                const raw = storage.getString("state");
                return parseState(raw);
            },
            async save(state) {
                storage.setString("state", JSON.stringify(state));
            },
            async clear() {
                storage.removeItem("state");
            },
        } satisfies StorageDriver;
    } catch (error) {
        console.warn("[sync] MMKV unavailable", error);
        return null;
    }
};

const createDriverChain = (key: string): StorageDriver => {
    const mmkv = createMmkvDriver(key);
    if (mmkv) return mmkv;
    const asyncStorage = createAsyncStorageDriver(key);
    if (asyncStorage) return asyncStorage;
    return new MemoryDriver();
};

const createDefaultState = (): SyncMetaState => ({
    schemaVersion: SCHEMA_VERSION,
    cursor: undefined,
    lastActiveAt: 0,
    sessionId: undefined,
    appliedEventIds: [],
});

const sanitizeState = (input: PersistedState | null): SyncMetaState => {
    if (!input || input.schemaVersion !== SCHEMA_VERSION) {
        return createDefaultState();
    }
    return {
        schemaVersion: SCHEMA_VERSION,
        cursor: typeof input.cursor === "string" ? input.cursor : undefined,
        lastActiveAt: typeof input.lastActiveAt === "number" && Number.isFinite(input.lastActiveAt)
            ? input.lastActiveAt
            : 0,
        sessionId: typeof input.sessionId === "string" ? input.sessionId : undefined,
        appliedEventIds: Array.isArray(input.appliedEventIds) ? [...input.appliedEventIds] : [],
    };
};

const createSyncMetaStorageFromDriver = (driver: StorageDriver): SyncMetaStorage => {
    let state: SyncMetaState = createDefaultState();
    let loaded = false;

    const ensureLoaded = async () => {
        if (loaded) return;
        const stored = await driver.load();
        state = sanitizeState(stored);
        loaded = true;
    };

    const persist = async () => {
        await driver.save(state);
    };

    const markEventsAppliedInternal = async (eventIds: string[], maxSize = 2000) => {
        await ensureLoaded();
        if (!eventIds.length) return;
        const seen = new Set(state.appliedEventIds);
        const merged = [...state.appliedEventIds];
        for (const id of eventIds) {
            if (seen.has(id)) continue;
            merged.push(id);
            seen.add(id);
        }
        if (merged.length > maxSize) {
            merged.splice(0, merged.length - maxSize);
        }
        state = { ...state, appliedEventIds: merged };
        await persist();
    };

    return {
        async loadOrDefault() {
            await ensureLoaded();
            return { ...state, appliedEventIds: [...state.appliedEventIds] };
        },
        getSnapshot() {
            if (!loaded) {
                throw new Error("Sync meta accessed before load");
            }
            return { ...state, appliedEventIds: [...state.appliedEventIds] };
        },
        async setCursor(cursor) {
            await ensureLoaded();
            state = { ...state, cursor: cursor ?? undefined };
            await persist();
        },
        async updateLastActiveAt(timestamp) {
            await ensureLoaded();
            state = { ...state, lastActiveAt: timestamp };
            await persist();
        },
        async setSessionId(sessionId) {
            await ensureLoaded();
            state = { ...state, sessionId: sessionId ?? undefined };
            await persist();
        },
        hasEventBeenApplied(eventId: string) {
            if (!loaded) {
                throw new Error("Sync meta accessed before load");
            }
            return state.appliedEventIds.includes(eventId);
        },
        async markEventApplied(eventId: string) {
            await markEventsAppliedInternal([eventId]);
        },
        async markEventsApplied(eventIds: string[], maxSize = 2000) {
            await markEventsAppliedInternal(eventIds, maxSize);
        },
        async clear() {
            state = createDefaultState();
            loaded = true;
            await driver.clear();
        },
    } satisfies SyncMetaStorage;
};

export const createNativeSyncMetaStorage = (key = "app.sync.meta"): SyncMetaStorage => {
    return createSyncMetaStorageFromDriver(createDriverChain(key));
};

export const createMemorySyncMetaStorage = (): SyncMetaStorage => {
    return createSyncMetaStorageFromDriver(new MemoryDriver());
};
