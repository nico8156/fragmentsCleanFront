import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import {
	appBecameBackground,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { commentRetrieval } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import { likesRetrieval } from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";
import { savedCoffeesRetrieval } from "@/app/core-logic/contextWL/savedCoffeeWl/usecases/read/savedCoffeeRetrieval";
import type { ProjectionSyncEvent } from "@/app/core-logic/contextWL/projectionSyncWl/gateway/projectionSync.gateway";
import { ticketRetrieval } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketRetrieval";
import {
	projectionSyncDisconnected,
	projectionSyncDisconnectRequested,
	projectionSyncEnsureConnectedRequested,
	projectionSyncEventReceived,
	projectionSyncStateChanged,
} from "@/app/core-logic/contextWL/projectionSyncWl/typeAction/projectionSync.action";
import {
	authMaybeRefreshRequested,
	authSessionRefreshed,
	authSignedOut,
	authSignInSucceeded,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import type { SyncMetaStorage } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncMeta.types";
import { outboxTelemetry } from "@/app/core-logic/contextWL/outboxWl/observation/outboxObservability";
import { logger } from "@/app/core-logic/utils/logger";

export type ProjectionSyncSessionRef = { current?: AuthSession };

type ProjectionSyncListenerDeps = {
	gateways: DependenciesWl["gateways"];
	sessionRef?: ProjectionSyncSessionRef;
	syncMetaStorage?: SyncMetaStorage;
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
	let syncMetaLoaded = false;

	const ensureSyncMetaLoaded = async () => {
		if (syncMetaLoaded) return;
		syncMetaLoaded = true;
		try {
			const meta = await deps.syncMetaStorage?.loadOrDefault();
			if (!lastEventId && meta?.cursor) lastEventId = meta.cursor;
		} catch (e) {
			logger.warn("[ProjectionSync] sync meta load failed", {
				error: String((e as any)?.message ?? e),
			});
		}
	};

	const persistCursor = (cursor?: string) => {
		if (!cursor) return;
		lastEventId = cursor;
		void deps.syncMetaStorage?.setCursor(cursor).catch((e) => {
			logger.warn("[ProjectionSync] sync cursor persist failed", {
				error: String((e as any)?.message ?? e),
			});
		});
	};

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
			outboxTelemetry.projectionRefreshRequested({
				projection: "comments",
				scope: "target",
				entityId: event.entityId,
				source: "projectionSync",
			});
			dispatch(
				commentRetrieval({
					targetId: event.entityId as any,
					op: opTypes.REFRESH,
				}) as any,
			);
		}

		if (event.projection === "likes" && event.scope === "target" && event.entityId) {
			outboxTelemetry.projectionRefreshRequested({
				projection: "likes",
				scope: "target",
				entityId: event.entityId,
				source: "projectionSync",
			});
			dispatch(likesRetrieval({ targetId: event.entityId as any }) as any);
		}

		if (event.projection === "tickets" && event.scope === "entity" && event.entityId) {
			outboxTelemetry.projectionRefreshRequested({
				projection: "tickets",
				scope: "entity",
				entityId: event.entityId,
				source: "projectionSync",
			});
			dispatch(ticketRetrieval({ ticketId: event.entityId as any }) as any);
		}

		if (event.projection === "entitlements" && event.scope === "user" && event.entityId) {
			outboxTelemetry.projectionRefreshRequested({
				projection: "entitlements",
				scope: "user",
				entityId: event.entityId,
				source: "projectionSync",
			});
			dispatch(entitlementsRetrieval({ userId: event.entityId }) as any);
		}

		if (event.projection === "savedCoffees" && event.scope === "user" && event.entityId) {
			outboxTelemetry.projectionRefreshRequested({
				projection: "savedCoffees",
				scope: "user",
				entityId: event.entityId,
				source: "projectionSync",
			});
			dispatch(savedCoffeesRetrieval() as any);
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

		await ensureSyncMetaLoaded();

		if (lastToken && token !== lastToken) {
			gateway.disconnect();
		}
		lastToken = token;

		gateway.connect({
			token,
			lastEventId: gateway.getLastEventId?.() ?? lastEventId,
			onStatus: (status) => {
				persistCursor(status.lastEventId);
				api.dispatch(projectionSyncStateChanged(status));
				if (status.state === "failed" && /HTTP (401|403)/.test(status.error ?? "")) {
					logger.warn("[ProjectionSync] auth failure observed; requesting session refresh", {
						error: status.error,
					});
					api.dispatch(authMaybeRefreshRequested());
				}
			},
			onEvent: (event) => {
				persistCursor(event.id);
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
		actionCreator: appBecameBackground,
		effect: async (_, api) => {
			void deps.syncMetaStorage?.updateLastActiveAt(Date.now()).catch((e) => {
				logger.warn("[ProjectionSync] sync activity persist failed", {
					error: String((e as any)?.message ?? e),
				});
			});
		},
	});

	return mw.middleware;
};
