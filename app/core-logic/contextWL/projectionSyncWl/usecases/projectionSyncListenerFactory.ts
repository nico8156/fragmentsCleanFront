import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import {
	appBecameActive,
	appBecameBackground,
	appConnectivityChanged,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { commentRetrieval } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { likesRetrieval } from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";
import type { ProjectionSyncEvent } from "@/app/core-logic/contextWL/projectionSyncWl/gateway/projectionSync.gateway";
import {
	projectionSyncDisconnected,
	projectionSyncDisconnectRequested,
	projectionSyncEnsureConnectedRequested,
	projectionSyncEventReceived,
	projectionSyncStateChanged,
} from "@/app/core-logic/contextWL/projectionSyncWl/typeAction/projectionSync.action";
import {
	authSessionRefreshed,
	authSignedOut,
	authSignInSucceeded,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { logger } from "@/app/core-logic/utils/logger";

export type ProjectionSyncSessionRef = { current?: AuthSession };

type ProjectionSyncListenerDeps = {
	gateways: DependenciesWl["gateways"];
	sessionRef?: ProjectionSyncSessionRef;
};

const isIgnorableSyncEvent = (event: ProjectionSyncEvent) =>
	event.eventName === "sync.connected" || event.eventName === "sync.heartbeat";

export const projectionSyncListenerFactory = (deps: ProjectionSyncListenerDeps) => {
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	const getGateway = () => deps.gateways?.projectionSync;
	const getSecureStore = () => deps.gateways?.auth?.secureStore;

	let lastToken: string | undefined;
	let lastEventId: string | undefined;

	const readSession = async (): Promise<AuthSession | undefined> => {
		if (deps.sessionRef?.current) return deps.sessionRef.current;
		try {
			return await getSecureStore()?.loadSession();
		} catch (e) {
			logger.warn("[ProjectionSync] readSession failed", {
				error: String((e as any)?.message ?? e),
			});
			return undefined;
		}
	};

	const routeProjectionUpdated = (event: ProjectionSyncEvent, dispatch: AppDispatchWl) => {
		if (isIgnorableSyncEvent(event)) return;
		if (event.eventName !== "projection.updated") return;

		if (event.projection === "comments" && event.scope === "target" && event.entityId) {
			dispatch(
				commentRetrieval({
					targetId: event.entityId as any,
					op: opTypes.REFRESH,
				}) as any,
			);
		}

		if (event.projection === "likes" && event.scope === "target" && event.entityId) {
			dispatch(likesRetrieval({ targetId: event.entityId as any }) as any);
		}
	};

	const disconnect = (api: { dispatch: AppDispatchWl }, reason: string) => {
		try {
			getGateway()?.disconnect();
		} finally {
			logger.info("[ProjectionSync] disconnected", { reason, lastEventId });
			api.dispatch(projectionSyncDisconnected());
		}
	};

	const ensureConnected = async (api: { dispatch: AppDispatchWl; getState: () => RootStateWl }) => {
		const gateway = getGateway();
		if (!gateway) return;

		const currentState = gateway.getState?.();
		if (currentState === "connected" || currentState === "reconnecting") return;

		const session = await readSession();
		const token = session?.tokens?.accessToken;
		if (!token) {
			logger.debug("[ProjectionSync] skipped connect: no token");
			return;
		}

		if (lastToken && token !== lastToken) {
			gateway.disconnect();
		}
		lastToken = token;

		gateway.connect({
			token,
			lastEventId: gateway.getLastEventId?.() ?? lastEventId,
			onStatus: (status) => {
				lastEventId = status.lastEventId ?? lastEventId;
				api.dispatch(projectionSyncStateChanged(status));
			},
			onEvent: (event) => {
				if (event.id) lastEventId = event.id;
				api.dispatch(projectionSyncEventReceived({ event }));
				routeProjectionUpdated(event, api.dispatch);
			},
		});
	};

	listen({
		actionCreator: projectionSyncEnsureConnectedRequested,
		effect: async (_, api) => ensureConnected(api as any),
	});

	listen({
		actionCreator: projectionSyncDisconnectRequested,
		effect: async (_, api) => disconnect(api as any, "runtime_request"),
	});

	listen({
		actionCreator: authSignInSucceeded,
		effect: async (_, api) => ensureConnected(api as any),
	});

	listen({
		actionCreator: authSessionRefreshed,
		effect: async (_, api) => {
			disconnect(api as any, "session_refreshed");
			await ensureConnected(api as any);
		},
	});

	listen({
		actionCreator: authSignedOut,
		effect: async (_, api) => {
			disconnect(api as any, "signed_out");
			lastToken = undefined;
		},
	});

	listen({
		actionCreator: appBecameActive,
		effect: async (_, api) => ensureConnected(api as any),
	});

	listen({
		actionCreator: appBecameBackground,
		effect: async (_, api) => disconnect(api as any, "background"),
	});

	listen({
		actionCreator: appConnectivityChanged,
		effect: async (action, api) => {
			if (action.payload.online) await ensureConnected(api as any);
			else disconnect(api as any, "offline");
		},
	});

	return mw.middleware;
};
