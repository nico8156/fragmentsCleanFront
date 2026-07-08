import { createListenerMiddleware, isAnyOf, TypedStartListening } from "@reduxjs/toolkit";

import type { ReadModelCacheGateway } from "@/app/core-logic/contextWL/appWl/gateway/readModelCache.gateway";
import {
	DurableReadModelCacheSnapshot,
	READ_MODEL_CACHE_SCHEMA_VERSION,
	readModelCacheRehydrated,
} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";
import { coffeesHydrated, coffeeRetrieved } from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import { hoursHydrated } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.action";
import type { AppDispatchWl, ReduxStoreWl, RootStateWl } from "@/app/store/reduxStoreWl";

type Deps = {
	storage: ReadModelCacheGateway;
	logger?: (message: string, payload?: unknown) => void;
};

const buildSnapshot = (state: RootStateWl): DurableReadModelCacheSnapshot => ({
	schemaVersion: READ_MODEL_CACHE_SCHEMA_VERSION,
	updatedAt: new Date().toISOString(),
	coffees: state.cfState,
	cfPhotos: state.pState,
	openingHours: state.ohState,
});

export const readModelCachePersistenceFactory = (deps: Deps) => {
	let pending: ReturnType<typeof setTimeout> | null = null;
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	const persistSoon = (state: RootStateWl) => {
		if (pending) clearTimeout(pending);
		pending = setTimeout(async () => {
			try {
				await deps.storage.saveSnapshot(buildSnapshot(state));
			} catch (error) {
				deps.logger?.("[read-cache] failed to persist", error);
			}
		}, 100);
	};

	listen({
		matcher: isAnyOf(coffeesHydrated, coffeeRetrieved, photosHydrated, hoursHydrated),
		effect: async (_, api) => {
			persistSoon(api.getState());
		},
	});

	return mw.middleware;
};

export const rehydrateReadModelCacheFactory = ({ storage, logger }: Deps) =>
	async (store: ReduxStoreWl): Promise<DurableReadModelCacheSnapshot | null> => {
		try {
			const snapshot = await storage.loadSnapshot();
			if (!snapshot) return null;
			store.dispatch(readModelCacheRehydrated(snapshot));
			return snapshot;
		} catch (error) {
			logger?.("[read-cache] failed to rehydrate", error);
			return null;
		}
	};
