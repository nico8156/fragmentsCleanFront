import { outboxPersistenceMiddlewareFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/outboxPersistenceFactory";
import { readModelCachePersistenceFactory } from "@/app/core-logic/contextWL/appWl/runtime/readModelCachePersistenceFactory";
import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";

import { API_BASE_URL } from "./config";
import { createHelpers } from "./helpers";
import { createInfrastructure } from "./infrastructure";
import { createWlListeners } from "./listeners";
import { readModelCacheStorage, syncMetaStorage } from "./runtimeDeps";

export const createWlStore = (): ReduxStoreWl => {
	const { gateways, outboxStorage, onSessionChanged, sessionRef } =
		createInfrastructure(API_BASE_URL);

	let storeRef: ReduxStoreWl | null = null;
	const getStore = () => {
		if (!storeRef) throw new Error("Store not ready yet");
		return storeRef;
	};

	const helpers = createHelpers(getStore);

	const listeners = createWlListeners({
		gateways,
		helpers,
		sessionRef,
		syncMetaStorage,
		onSessionChanged,
	});

	const outboxPersistMw = outboxPersistenceMiddlewareFactory({ storage: outboxStorage });
	const readModelCachePersistMw = readModelCachePersistenceFactory({ storage: readModelCacheStorage });

	const store = initReduxStoreWl({
		dependencies: { gateways, helpers },
		listeners,
		extraMiddlewares: [outboxPersistMw, readModelCachePersistMw],
	});

	storeRef = store;

	return store;
};
