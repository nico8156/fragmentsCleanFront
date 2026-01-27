import { outboxPersistenceMiddlewareFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/outboxPersistenceFactory";
import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";

import { API_BASE_URL, WS_URL } from "./config";
import { createHelpers } from "./helpers";
import { createInfrastructure } from "./infrastructure";
import { createWlListeners } from "./listeners";

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
		wsUrl: WS_URL,
		sessionRef,
		onSessionChanged,
	});

	const outboxPersistMw = outboxPersistenceMiddlewareFactory({ storage: outboxStorage });

	const store = initReduxStoreWl({
		dependencies: { gateways, helpers },
		listeners,
		extraMiddlewares: [outboxPersistMw],
	});

	storeRef = store;

	return store;
};
