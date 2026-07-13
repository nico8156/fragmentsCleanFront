import { useEffect } from "react";
import { useStore } from "react-redux";

import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

import { mountAppStateAdapter } from "@/app/adapters/primary/runtime/appState.adapter";
import { mountNetInfoAdapter } from "@/app/adapters/primary/runtime/netInfo.adapter";

import { createApplicationBootProcess } from "@/app/core-logic/contextWL/appWl/usecases/applicationBootProcess";
import { logger } from "@/app/core-logic/utils/logger";

// ✅ runtime deps (no store/gateways wiring import)
import { outboxStorage, readModelCacheStorage } from "@/app/adapters/primary/wiring/runtimeDeps";

// ---- dev guard (jamais en prod) ----
const CLEAR_OUTBOX_ON_BOOT = __DEV__ && false;

export const AppBootstrap = () => {
	const store = useStore() as unknown as ReduxStoreWl;

	useEffect(() => {
		logger.info("[BOOT] AppBootstrap mounted");

		// 0) Adapters (runtime signals)
		const unmountNetInfo = mountNetInfoAdapter(store);
		const unmountAppState = mountAppStateAdapter(store, { ignoreFirstActive: false });

		logger.info("[BOOT] NetInfo + AppState adapters mounted");

		const bootProcess = createApplicationBootProcess({
			store,
			outboxStorage,
			readModelCacheStorage,
			logger,
			clearOutboxOnBoot: CLEAR_OUTBOX_ON_BOOT,
		});
		void bootProcess.start();

		return () => {
			logger.info("[BOOT] AppBootstrap unmount");
			bootProcess.cancel();

			unmountAppState?.();
			unmountNetInfo?.();

			logger.info("[BOOT] NetInfo + AppState adapters unmounted");
		};
	}, [store]);

	return null;
};
