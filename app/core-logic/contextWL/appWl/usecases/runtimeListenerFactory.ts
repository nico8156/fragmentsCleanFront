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
	wsDisconnectRequested,
	wsEnsureConnectedRequested,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

import { logger } from "@/app/core-logic/utils/logger";

const isSignedIn = (s: RootStateWl) => s.aState?.status === "signedIn";

export const runtimeListenerFactory = () => {
	const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen =
		runtimeListener.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;
	const bootReady = (s: RootStateWl) => s.appState?.boot?.doneWarmup === true; // adapte le chemin

	const kickOnlineAuthed = (api: {
		dispatch: AppDispatchWl;
		getState: () => RootStateWl;
	}) => {
		// outbox enabled again
		api.dispatch(outboxResumeRequested());
		// WS + delivery + observation
		api.dispatch(wsEnsureConnectedRequested());
		api.dispatch(outboxProcessOnce());
		api.dispatch(outboxWatchdogTick());
	};
	listen({
		actionCreator: appBecameActive,
		effect: async (_, api) => {
			const state = api.getState();
			const online = selectIsOnline(state);
			const signedIn = isSignedIn(state);
			const bootReady = selectBootReady(state);

			logger.info("[APP RUNTIME] appBecameActive", { online, signedIn, bootReady });

			if (!bootReady) return;
			if (!signedIn) return;

			api.dispatch(wsEnsureConnectedRequested());

			if (!online) return;
			kickOnlineAuthed(api);
		},
	});

	listen({
		actionCreator: appConnectivityChanged,
		effect: async (action, api) => {
			const state = api.getState();
			const signedIn = isSignedIn(state);
			const bootReady = selectBootReady(state);

			if (!action.payload.online) {
				logger.info("[APP RUNTIME] connectivity offline: disconnect ws + suspend outbox");
				api.dispatch(wsDisconnectRequested());
				api.dispatch(outboxSuspendRequested());
				api.dispatch(wsEnsureConnectedRequested());
				return;
			}

			logger.info("[APP RUNTIME] connectivity online", { signedIn, bootReady });

			api.dispatch(outboxResumeRequested());

			if (!bootReady) return;

			if (!signedIn) {
				logger.info("[APP RUNTIME] online: skip ws/outbox/watchdog (not signedIn)");
				return;
			}

			kickOnlineAuthed(api);
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

	return runtimeListener.middleware;
};
