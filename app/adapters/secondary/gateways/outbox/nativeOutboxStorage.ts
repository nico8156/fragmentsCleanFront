import { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

type StorageDriver = {
    load(): Promise<string | null>;
    save(value: string): Promise<void>;
    clear(): Promise<void>;
};

const parseSnapshot = (raw: string | null): OutboxStateWl | null => {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as OutboxStateWl;
    } catch (error) {
        throw new Error("Unreadable offline command storage", { cause: error });
    }
};

const createRequiredMmkvDriver = (key: string): StorageDriver => {
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
        throw new Error("[outbox] Durable MMKV storage is required for offline commands", { cause: error });
    }
};

export const createNativeOutboxStorage = (key = "app.outbox"): OutboxStorageGateway => {
    const drivers = new Map<string, StorageDriver>();
    const driverFor = (userId?: string) => {
        const scope = userId ? `${key}.account.${encodeURIComponent(userId)}` : key;
        if (!drivers.has(scope)) drivers.set(scope, createRequiredMmkvDriver(scope));
        return drivers.get(scope)!;
    };
    driverFor(); // Fail fast if durable storage is unavailable.
    return {
        async loadSnapshot(userId) {
            const raw = await driverFor(userId).load();
            return parseSnapshot(raw);
        },
        async saveSnapshot(snapshot, userId) {
            await driverFor(userId).save(JSON.stringify(snapshot));
        },
        async clear(userId) {
            await driverFor(userId).clear();
        },
    } satisfies OutboxStorageGateway;
};
