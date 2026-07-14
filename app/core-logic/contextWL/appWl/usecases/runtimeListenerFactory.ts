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
	authMaybeRefreshRequested,
	authUserHydrationRequested,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { refreshNonTerminalTickets } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketRetrieval";
import { selectNonTerminalTicketIds } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";
import { commentRetrieval } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { selectKnownCommentTargetIds } from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import { likesRetrieval } from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";
import { selectKnownLikeTargetIds } from "@/app/core-logic/contextWL/likeWl/selector/likeWl.selector";

import {
	projectionSyncDisconnectRequested,
	projectionSyncEnsureConnectedRequested,
} from "@/app/core-logic/contextWL/projectionSyncWl/typeAction/projectionSync.action";

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
		api.dispatch(projectionSyncEnsureConnectedRequested());
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

	const refreshKnownTicketsInProgress = (api: {
		dispatch: AppDispatchWl;
		getState: () => RootStateWl;
	}) => {
		if (!selectNonTerminalTicketIds(api.getState()).length) return;
		api.dispatch(refreshNonTerminalTickets() as any);
	};

	const refreshKnownReadModels = (api: {
		dispatch: AppDispatchWl;
		getState: () => RootStateWl;
	}) => {
		const state = api.getState();
		const userId = getSessionUserId(state);

		if (userId && state.enState?.byUser?.[String(userId)]) {
			api.dispatch(entitlementsRetrieval({ userId }) as any);
		}

		for (const targetId of selectKnownCommentTargetIds(state)) {
			api.dispatch(commentRetrieval({
				targetId,
				op: opTypes.REFRESH,
				cursor: "",
				limit: 20,
			}) as any);
		}

		for (const targetId of selectKnownLikeTargetIds(state)) {
			api.dispatch(likesRetrieval({ targetId }) as any);
		}

		refreshKnownTicketsInProgress(api);
	};

	listen({
		actionCreator: appBecameActive,
		effect: async (_, api) => {
			const state = api.getState();
			const online = selectIsOnline(state);
			const authed = hasSession(state);
			const bootReady = selectBootReady(state);

			logger.info("[APP RUNTIME] appBecameActive", { online, authed, bootReady });

			if (online) {
				api.dispatch(outboxResumeRequested());
			}

			if (!bootReady) return;
			if (!authed) return;

			// ✅ Toujours : refresh + hydrate + tentative projection sync
			refreshAndHydrate(api);
			api.dispatch(projectionSyncEnsureConnectedRequested());

			// ✅ Si online, on kick aussi outbox/watchdog
			if (!online) return;
			refreshKnownReadModels(api);
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
				logger.info("[APP RUNTIME] connectivity offline: disconnect projection sync + suspend outbox");
				api.dispatch(projectionSyncDisconnectRequested());
				api.dispatch(outboxSuspendRequested());
				return;
			}

			logger.info("[APP RUNTIME] connectivity online", { authed, bootReady });

			api.dispatch(outboxResumeRequested());

			if (!bootReady) return;

			// ✅ Même si WS/outbox, on hydrate aussi (re-sync après offline)
			if (authed) {
				refreshAndHydrate(api);
				refreshKnownReadModels(api);
				kickOnlineAuthed(api);
			} else {
				logger.info("[APP RUNTIME] online: skip ws/outbox/watchdog (no session)");
			}
		},
	});

	listen({
		actionCreator: appBecameBackground,
		effect: async (_, api) => {
			logger.info("[APP RUNTIME] appBecameBackground: suspend outbox + projection sync disconnect");
			api.dispatch(outboxSuspendRequested());
			api.dispatch(projectionSyncDisconnectRequested());
		},
	});

	return runtimeListener.middleware;
};
