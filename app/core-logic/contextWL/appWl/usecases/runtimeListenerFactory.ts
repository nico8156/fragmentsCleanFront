import { selectBootReady, selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";

import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import {
	appBecameActive,
	appBecameBackground,
	appConnectivityChanged,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import {
	outboxProcessOnce,
	outboxResumeRequested,
	outboxSuspendRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";

import {
	wsConnected,
	wsDisconnectRequested,
	wsEnsureConnectedRequested,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

import {
	authMaybeRefreshRequested,
	authUserHydrationRequested,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import { logger } from "@/app/core-logic/utils/logger";

// ✅ IMPORTANT: on ne base plus "signedIn" sur status (qui peut repasser "loading" pendant hydration)
// => on se base sur la présence d'une session (userId)
const getSessionUserId = (s: RootStateWl) => s.aState?.session?.userId;
const hasSession = (s: RootStateWl) => Boolean(getSessionUserId(s));

export const runtimeListenerFactory = () => {
	const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen =
		runtimeListener.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	const kickOnlineAuthed = (api: {
		dispatch: AppDispatchWl;
		getState: () => RootStateWl;
	}) => {
		api.dispatch(outboxResumeRequested());
		api.dispatch(wsEnsureConnectedRequested());
		api.dispatch(outboxProcessOnce());
		api.dispatch(outboxWatchdogTick());
	};

	const refreshAndHydrate = (api: {
		dispatch: AppDispatchWl;
		getState: () => RootStateWl;
	}) => {
		const state = api.getState();
		const userId = getSessionUserId(state);
		if (!userId) return;

		// 1) Refresh token si nécessaire
		api.dispatch(authMaybeRefreshRequested());

		// 2) Recharger le user (résout: app background -> active, données absentes/stale)
		api.dispatch(authUserHydrationRequested({ userId }));
	};

	listen({
		actionCreator: appBecameActive,
		effect: async (_, api) => {
			const state = api.getState();
			const online = selectIsOnline(state);
			const authed = hasSession(state);
			const bootReady = selectBootReady(state);

			logger.info("[APP RUNTIME] appBecameActive", { online, authed, bootReady });

			if (!bootReady) return;
			if (!authed) return;

			// ✅ Toujours : refresh + hydrate + tentative WS
			refreshAndHydrate(api);
			api.dispatch(wsEnsureConnectedRequested());

			// ✅ Si online, on kick aussi outbox/watchdog
			if (!online) return;
			kickOnlineAuthed(api);
		},
	});

	listen({
		actionCreator: appConnectivityChanged,
		effect: async (action, api) => {
			const state = api.getState();
			const authed = hasSession(state);
			const bootReady = selectBootReady(state);

			if (!action.payload.online) {
				logger.info("[APP RUNTIME] connectivity offline: disconnect ws + suspend outbox");
				api.dispatch(wsDisconnectRequested());
				api.dispatch(outboxSuspendRequested());
				return;
			}

			logger.info("[APP RUNTIME] connectivity online", { authed, bootReady });

			api.dispatch(outboxResumeRequested());

			if (!bootReady) return;

			// ✅ Même si WS/outbox, on hydrate aussi (re-sync après offline)
			if (authed) {
				refreshAndHydrate(api);
				kickOnlineAuthed(api);
			} else {
				logger.info("[APP RUNTIME] online: skip ws/outbox/watchdog (no session)");
			}
		},
	});

	listen({
		actionCreator: appBecameBackground,
		effect: async (_, api) => {
			logger.info("[APP RUNTIME] appBecameBackground: suspend outbox + ws disconnect");
			api.dispatch(outboxSuspendRequested());
			api.dispatch(wsDisconnectRequested());
		},
	});

	// ✅ BONUS: dès que le WS se connecte (reconnect), on resync le user
	listen({
		actionCreator: wsConnected,
		effect: async (_, api) => {
			const state = api.getState();
			const authed = hasSession(state);
			if (!authed) return;

			logger.info("[APP RUNTIME] wsConnected => authUserHydrationRequested");
			refreshAndHydrate(api);
		},
	});

	return runtimeListener.middleware;
};

