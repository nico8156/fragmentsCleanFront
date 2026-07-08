import type { DurableReadModelCacheSnapshot } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

export interface ReadModelCacheGateway {
	loadSnapshot(): Promise<DurableReadModelCacheSnapshot | null>;
	saveSnapshot(snapshot: DurableReadModelCacheSnapshot): Promise<void>;
	clear(): Promise<void>;
}
