import type { DurableReadModelCacheSnapshot } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

export interface ReadModelCacheGateway {
	loadSnapshot(userId?: string): Promise<DurableReadModelCacheSnapshot | null>;
	saveSnapshot(snapshot: DurableReadModelCacheSnapshot, userId?: string): Promise<void>;
	clear(userId?: string): Promise<void>;
}
