import { useEffect } from "react";
import { useStore } from "react-redux";

import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

import {
	appBootFailed,
	appBootSucceeded,
	appHydrationDone,
	appWarmupDone,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import { mountAppStateAdapter } from "@/app/adapters/primary/runtime/appState.adapter";
import { mountNetInfoAdapter } from "@/app/adapters/primary/runtime/netInfo.adapter";

import { initializeAuth } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";

import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import {
	getOnceRequested,
	requestPermission,
} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";

import { onCfPhotoRetrieval } from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { coffeeGlobalRetrieval } from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import { onOpeningHourRetrieval } from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";

import { selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";
import { logger } from "@/app/core-logic/utils/logger";

// ✅ runtime deps (no store/gateways wiring import)
import { outboxStorage } from "@/app/adapters/primary/wiring/runtimeDeps";

// ---- dev guard (jamais en prod) ----
const CLEAR_OUTBOX_ON_BOOT = __DEV__ && false;

const selectUserIdForEntitlements = (state: any): string | undefined =>
	state?.aState?.session?.userId ??
	state?.aState?.currentUser?.id ??
	state?.auth?.userId ??
	state?.user?.id ??
	undefined;

const isSignedIn = (state: any): boolean => state?.aState?.status === "signedIn";

export const AppBootstrap = () => {
	const store = useStore() as unknown as ReduxStoreWl;

	useEffect(() => {
		logger.info("[BOOT] AppBootstrap mounted");

		// 0) Adapters (runtime signals)
		const unmountNetInfo = mountNetInfoAdapter(store);
		const unmountAppState = mountAppStateAdapter(store, { ignoreFirstActive: false });

		logger.info("[BOOT] NetInfo + AppState adapters mounted");

		let cancelled = false;
		const dispatch: any = store.dispatch;

		// create here to avoid module-level surprises (tests / hot reload)
		const runRehydrateOutbox = rehydrateOutboxFactory({ storage: outboxStorage });

		const bootRuntime = async () => {
			// 1) Hydration app
			store.dispatch(appHydrationDone());

			// 2) Auth early (charge session secure store)
			await dispatch(initializeAuth());
			if (cancelled) return;

			// 3) Outbox storage (DEV only)
			if (CLEAR_OUTBOX_ON_BOOT) {
				logger.info("[BOOT] DEV: clearing outbox storage (flag enabled)");
				await outboxStorage.clear();
			}

			// 4) Outbox rehydrate
			logger.info("[BOOT] Rehydrate outbox: start");
			const snapshot = await runRehydrateOutbox(store);
			logger.info("[BOOT] Rehydrate outbox: done, queue length =", snapshot.queue.length);
			if (cancelled) return;

			// 5) Optionnel: kick outbox once si on est déjà authed + online
			// (sinon runtimeListener fera le job à appBecameActive / connectivity online)
			const stateNow: any = store.getState();
			if (snapshot.queue.length && isSignedIn(stateNow) && selectIsOnline(stateNow)) {
				store.dispatch(outboxProcessOnce());
			}
		};

		const warmupData = async () => {
			// Location permissions + once (ne bloque pas le boot si ça échoue)
			try {
				store.dispatch(requestPermission());
				store.dispatch(getOnceRequested({ accuracy: "high" }));
			} catch { }

			// Global data
			await dispatch(coffeeGlobalRetrieval());
			await dispatch(onCfPhotoRetrieval());
			await dispatch(onOpeningHourRetrieval());

			// Entitlements (si userId connu)
			const uid = selectUserIdForEntitlements(store.getState());
			if (uid) {
				await dispatch(entitlementsRetrieval({ userId: uid }));
			}
		};

		(async () => {
			try {
				await bootRuntime();
				if (cancelled) return;

				await warmupData();
				if (cancelled) return;

				store.dispatch(appWarmupDone({ message: "Warmup OK" }));
				store.dispatch(appBootSucceeded());
				logger.info("[BOOT] App boot succeeded");
			} catch (e: any) {
				logger.error("[BOOT] App boot failed", e);
				store.dispatch(appBootFailed({ message: String(e?.message ?? e) }));
			}
		})();

		return () => {
			logger.info("[BOOT] AppBootstrap unmount");
			cancelled = true;

			unmountAppState?.();
			unmountNetInfo?.();

			logger.info("[BOOT] NetInfo + AppState adapters unmounted");
		};
	}, [store]);

	return null;
};
