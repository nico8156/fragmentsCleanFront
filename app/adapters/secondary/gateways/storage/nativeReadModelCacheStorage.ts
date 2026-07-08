import type { ReadModelCacheGateway } from "@/app/core-logic/contextWL/appWl/gateway/readModelCache.gateway";
import {
	DurableReadModelCacheSnapshot,
	READ_MODEL_CACHE_SCHEMA_VERSION,
} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

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

const parseSnapshot = (raw: string | null): DurableReadModelCacheSnapshot | null => {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as DurableReadModelCacheSnapshot;
		if (parsed?.schemaVersion !== READ_MODEL_CACHE_SCHEMA_VERSION) return null;
		return parsed;
	} catch (error) {
		console.warn("[read-cache] invalid persisted snapshot", error);
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
		console.warn("[read-cache] AsyncStorage unavailable", error);
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
		console.warn("[read-cache] MMKV unavailable", error);
		return null;
	}
};

const createDriverChain = (key: string): StorageDriver =>
	createMmkvDriver(key) ?? createAsyncStorageDriver(key) ?? new MemoryDriver();

export const createNativeReadModelCacheStorage = (
	key = "app.read-model-cache",
): ReadModelCacheGateway => {
	const driver = createDriverChain(key);
	return {
		async loadSnapshot() {
			return parseSnapshot(await driver.load());
		},
		async saveSnapshot(snapshot) {
			await driver.save(JSON.stringify(snapshot));
		},
		async clear() {
			await driver.clear();
		},
	};
};
