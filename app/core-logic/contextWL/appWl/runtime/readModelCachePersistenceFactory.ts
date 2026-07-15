import { createListenerMiddleware, isAnyOf, TypedStartListening } from "@reduxjs/toolkit";

import type { ReadModelCacheGateway } from "@/app/core-logic/contextWL/appWl/gateway/readModelCache.gateway";
import {
	DurableReadModelCacheSnapshot,
	READ_MODEL_CACHE_SCHEMA_VERSION,
	readModelCacheRehydrated,
} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";
import { articleListReceived, articleReceived } from "@/app/core-logic/contextWL/articleWl/typeAction/article.action";
import { coffeesHydrated, coffeeRetrieved } from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import { commentsRetrieved } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { addOptimisticCreated, deleteOptimisticApplied, updateOptimisticApplied } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { deleteReconciled, updateReconciled } from "@/app/core-logic/contextWL/commentWl/typeAction/commentAck.action";
import { entitlementsHydrated, entitlementsSetThresholds } from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.action";
import {
	likeOptimisticApplied,
	likeReconciled,
	likeRollback,
	likesRetrieved,
	unlikeOptimisticApplied,
} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import {
	savedCoffeeOptimisticSet,
	savedCoffeeReconciled,
	savedCoffeeRollback,
	savedCoffeesRetrieved,
} from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";
import { hoursHydrated } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.action";
import { createReconciled, createRollback, deleteRollback, updateRollback } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";
import {
	ticketOptimisticCreated,
	ticketReconciledConfirmed,
	ticketReconciledRejected,
	ticketRetrieved,
	ticketRollBack,
} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
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
	comments: state.cState,
	likes: state.lState,
	savedCoffees: state.scState,
	tickets: state.tState,
	entitlement: state.enState,
	articles: state.arState,
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
		matcher: isAnyOf(
			coffeesHydrated,
			coffeeRetrieved,
			photosHydrated,
			hoursHydrated,
			articleReceived,
			articleListReceived,
			commentsRetrieved,
			addOptimisticCreated,
			updateOptimisticApplied,
			deleteOptimisticApplied,
			createReconciled,
			updateReconciled,
			deleteReconciled,
			createRollback,
			updateRollback,
			deleteRollback,
			likesRetrieved,
			likeOptimisticApplied,
			unlikeOptimisticApplied,
			likeReconciled,
			likeRollback,
			savedCoffeesRetrieved,
			savedCoffeeOptimisticSet,
			savedCoffeeReconciled,
			savedCoffeeRollback,
			ticketRetrieved,
			ticketOptimisticCreated,
			ticketReconciledConfirmed,
			ticketReconciledRejected,
			ticketRollBack,
			entitlementsHydrated,
			entitlementsSetThresholds,
		),
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
