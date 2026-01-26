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

import { selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";
import { logger } from "@/app/core-logic/utils/logger";

const isSignedIn = (s: RootStateWl) => s.aState?.status === "signedIn";

export const runtimeListenerFactory = () => {
	const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen =
		runtimeListener.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

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

			logger.info("[APP RUNTIME] appBecameActive", { online, signedIn });

			if (!signedIn) return;

			// ✅ IMPORTANT: on tente toujours de reconnecter le WS au retour foreground,
			// même si NetInfo n’a pas encore “online=true”.
			api.dispatch(wsEnsureConnectedRequested());

			// Outbox + watchdog seulement si online
			if (!online) return;

			kickOnlineAuthed(api);
		},
	});

	listen({
		actionCreator: appConnectivityChanged,
		effect: async (action, api) => {
			const signedIn = isSignedIn(api.getState());

			if (!action.payload.online) {
				logger.info("[APP RUNTIME] connectivity offline: disconnect ws + suspend outbox");
				api.dispatch(wsDisconnectRequested());
				api.dispatch(outboxSuspendRequested());
				api.dispatch(wsEnsureConnectedRequested());

				return;
			}

			logger.info("[APP RUNTIME] connectivity online", { signedIn });

			// on repasse outbox en mode actif même si pas encore authed
			api.dispatch(outboxResumeRequested());

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
