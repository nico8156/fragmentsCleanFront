import { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

type StorageDriver = {
    load(): Promise<string | null>;
    save(value: string): Promise<void>;
    clear(): Promise<void>;
};

class MemoryDriver implements StorageDriver {
    private snapshot: string | null = null;

    async load() {
        return this.snapshot;
    }

    async save(value: string) {
        this.snapshot = value;
    }

    async clear() {
        this.snapshot = null;
    }
}

const parseSnapshot = (raw: string | null): OutboxStateWl | null => {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as OutboxStateWl;
    } catch (error) {
        console.warn("[outbox] invalid persisted snapshot", error);
        return null;
    }
};

const createAsyncStorageDriver = (key: string): StorageDriver | null => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AsyncStorage = require("@react-native-async-storage/async-storage");
        const storage = AsyncStorage.default ?? AsyncStorage;
        if (!storage) return null;
        return {
            async load() {
                return storage.getItem(key);
            },
            async save(value) {
                await storage.setItem(key, value);
            },
            async clear() {
                await storage.removeItem(key);
            },
        } satisfies StorageDriver;
    } catch (error) {
        console.warn("[outbox] AsyncStorage unavailable", error);
        return null;
    }
};

const createMmkvDriver = (key: string): StorageDriver | null => {
    try {
// eslint-disable-next-line @typescript-eslint/no-require-imports
        const { MMKVLoader } = require("react-native-mmkv-storage");
        const storage = new MMKVLoader().withInstanceID(key).initialize();
        return {
            async load() {
                return storage.getString("state");
            },
            async save(value) {
                storage.setString("state", value);
            },
            async clear() {
                storage.removeItem("state");
            },
        } satisfies StorageDriver;
    } catch (error) {
        console.warn("[outbox] MMKV unavailable", error);
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

export const createNativeOutboxStorage = (key = "app.outbox"): OutboxStorageGateway => {
    const driver = createDriverChain(key);
    return {
        async loadSnapshot() {
            const raw = await driver.load();
            return parseSnapshot(raw);
        },
        async saveSnapshot(snapshot) {
            await driver.save(JSON.stringify(snapshot));
        },
        async clear() {
            await driver.clear();
        },
    } satisfies OutboxStorageGateway;
};
