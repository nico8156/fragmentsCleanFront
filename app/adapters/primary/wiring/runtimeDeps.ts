import { createNativeOutboxStorage } from "@/app/adapters/secondary/gateways/outbox/nativeOutboxStorage";
import { createNativeReadModelCacheStorage } from "@/app/adapters/secondary/gateways/storage/nativeReadModelCacheStorage";

export const outboxStorage = createNativeOutboxStorage();
export const readModelCacheStorage = createNativeReadModelCacheStorage();
