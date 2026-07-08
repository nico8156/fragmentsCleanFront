import { createNativeOutboxStorage } from "@/app/adapters/secondary/gateways/outbox/nativeOutboxStorage";
import { createNativeReadModelCacheStorage } from "@/app/adapters/secondary/gateways/storage/nativeReadModelCacheStorage";
import { createNativeSyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";

export const outboxStorage = createNativeOutboxStorage();
export const readModelCacheStorage = createNativeReadModelCacheStorage();
export const syncMetaStorage = createNativeSyncMetaStorage();
