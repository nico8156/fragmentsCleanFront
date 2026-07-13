import type { ReadModelCacheGateway } from "@/app/core-logic/contextWL/appWl/gateway/readModelCache.gateway";
import {
	appBootFailed,
	appBootSucceeded,
	appHydrationDone,
	appWarmupDone,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import { rehydrateReadModelCacheFactory } from "@/app/core-logic/contextWL/appWl/runtime/readModelCachePersistenceFactory";
import { articlesListRetrieval } from "@/app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval";
import { onCfPhotoRetrieval } from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { coffeeGlobalRetrieval } from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import {
	getOnceRequested,
	requestPermission,
} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";
import { onOpeningHourRetrieval } from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import type { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";
import { initializeAuth } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

type BootLogger = {
	info: (message: string, payload?: unknown) => void;
	warn: (message: string, payload?: unknown) => void;
	error: (message: string, payload?: unknown) => void;
};

type ApplicationBootProcessDeps = {
	store: ReduxStoreWl;
	outboxStorage: OutboxStorageGateway;
	readModelCacheStorage: ReadModelCacheGateway;
	logger: BootLogger;
	clearOutboxOnBoot?: boolean;
};

const selectUserIdForEntitlements = (state: any): string | undefined =>
	state?.aState?.session?.userId ??
	state?.aState?.currentUser?.id ??
	state?.auth?.userId ??
	state?.user?.id ??
	undefined;

const isSignedIn = (state: any): boolean => state?.aState?.status === "signedIn";

export const createApplicationBootProcess = ({
	store,
	outboxStorage,
	readModelCacheStorage,
	logger,
	clearOutboxOnBoot = false,
}: ApplicationBootProcessDeps) => {
	let cancelled = false;
	const dispatch: any = store.dispatch;

	const shouldStop = () => cancelled;

	const bootRuntime = async () => {
		store.dispatch(appHydrationDone());

		await dispatch(initializeAuth());
		if (shouldStop()) return;

		if (clearOutboxOnBoot) {
			logger.info("[BOOT] DEV: clearing outbox storage (flag enabled)");
			await outboxStorage.clear();
		}

		const runRehydrateOutbox = rehydrateOutboxFactory({ storage: outboxStorage });
		logger.info("[BOOT] Rehydrate outbox: start");
		const snapshot = await runRehydrateOutbox(store);
		logger.info("[BOOT] Rehydrate outbox: done, queue length =", snapshot.queue.length);
		if (shouldStop()) return;

		const runRehydrateReadModelCache = rehydrateReadModelCacheFactory({
			storage: readModelCacheStorage,
			logger: logger.info,
		});
		logger.info("[BOOT] Rehydrate read model cache: start");
		const readCacheSnapshot = await runRehydrateReadModelCache(store);
		logger.info("[BOOT] Rehydrate read model cache: done", {
			hit: Boolean(readCacheSnapshot),
			updatedAt: readCacheSnapshot?.updatedAt,
		});
		if (shouldStop()) return;

		const stateNow: any = store.getState();
		if (snapshot.queue.length && isSignedIn(stateNow) && selectIsOnline(stateNow)) {
			store.dispatch(outboxProcessOnce());
		}
	};

	const warmupData = async () => {
		const runWarmupStep = async (label: string, step: () => Promise<unknown>) => {
			try {
				await step();
			} catch (e: any) {
				logger.warn(`[BOOT] Warmup skipped: ${label}`, String(e?.message ?? e));
			}
		};

		try {
			store.dispatch(requestPermission());
			store.dispatch(getOnceRequested({ accuracy: "high" }));
		} catch {
			// Location warmup must not block boot.
		}

		await runWarmupStep("coffees", () => dispatch(coffeeGlobalRetrieval()));
		await runWarmupStep("coffee photos", () => dispatch(onCfPhotoRetrieval()));
		await runWarmupStep("opening hours", () => dispatch(onOpeningHourRetrieval()));
		await runWarmupStep("articles", () => dispatch(articlesListRetrieval({ locale: "fr-FR" })));

		const uid = selectUserIdForEntitlements(store.getState());
		if (uid) {
			await runWarmupStep("entitlements", () => dispatch(entitlementsRetrieval({ userId: uid })));
		}
	};

	const start = async () => {
		try {
			await bootRuntime();
			if (shouldStop()) return;

			await warmupData();
			if (shouldStop()) return;

			store.dispatch(appWarmupDone({ message: "Warmup OK" }));
			store.dispatch(appBootSucceeded());
			logger.info("[BOOT] App boot succeeded");
		} catch (e: any) {
			logger.error("[BOOT] App boot failed", e);
			store.dispatch(appBootFailed({ message: String(e?.message ?? e) }));
		}
	};

	return {
		start,
		cancel: () => {
			cancelled = true;
		},
	};
};
