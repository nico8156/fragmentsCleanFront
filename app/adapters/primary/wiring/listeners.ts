import { createCommentUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { commentDeleteUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";
import { commentUpdateWlUseCase } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";

import { likeToggleUseCaseFactory } from "@/app/core-logic/contextWL/likeWl/usecases/write/likePressedUseCase";

import { ticketSubmitUseCaseFactory } from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";

import { outboxWatchdogFactory } from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";

import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";
import { userLocationListenerFactory } from "@/app/core-logic/contextWL/locationWl/usecases/userLocationFactory";
import { authListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory";
import { projectionSyncListenerFactory } from "@/app/core-logic/contextWL/projectionSyncWl/usecases/projectionSyncListenerFactory";

import type { Helpers } from "@/app/store/appStateWl";
import type { GatewaysWl } from "./types";

// normalise: accepte soit une function, soit un objet { middleware: fn }
const mwOf = (x: any) => (typeof x === "function" ? x : x?.middleware);

export const createWlListeners = (p: {
	gateways: GatewaysWl;
	helpers: Helpers;
	sessionRef: { current?: any };
	onSessionChanged: (s: any) => void;
}) => {
	const { gateways, helpers, sessionRef, onSessionChanged } = p;

	return [
		// Comments
		mwOf(createCommentUseCaseFactory({ gateways, helpers })),
		mwOf(commentDeleteUseCaseFactory({ gateways, helpers })),
		mwOf(commentUpdateWlUseCase({ gateways, helpers })),

		// Likes
		mwOf(likeToggleUseCaseFactory({ gateways, helpers })),

		// Outbox
		mwOf(processOutboxFactory({ gateways, helpers })),

		// Tickets + entitlements
		mwOf(ticketSubmitUseCaseFactory({ gateways, helpers })),

		// Runtime
		mwOf(runtimeListenerFactory()),

		// Auth + projection sync
		mwOf(authListenerFactory({ gateways, helpers: {}, onSessionChanged })),
		mwOf(projectionSyncListenerFactory({ gateways, sessionRef })),

		// Watchdog
		mwOf(outboxWatchdogFactory({ gateways, enableTimer: true, tickMs: 20_000 })),

		// Location
		mwOf(userLocationListenerFactory({ gateways, helpers })),
	].filter((mw) => typeof mw === "function");
};
