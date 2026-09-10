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
		throw new Error("[read-cache] Durable MMKV storage is required for offline read models", { cause: error });
	}
};

export const createNativeReadModelCacheStorage = (
	key = "app.read-model-cache",
): ReadModelCacheGateway => {
	const driver = createRequiredMmkvDriver(key);
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
