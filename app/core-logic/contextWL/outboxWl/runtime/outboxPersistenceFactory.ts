import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, isAnyOf, TypedStartListening } from "@reduxjs/toolkit";

import {
	dequeueCommitted,
	dropCommitted,
	enqueueCommitted,
	markAwaitingAck,
	markFailed,
	markProcessing,
	outboxRehydrateCommitted,
	outboxResumeRequested,
	outboxSuspendRequested,
	scheduleRetry,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { selectOutbox } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import type { OutboxListenerApi, OutboxPersistenceDeps } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxPersistence.types";
import { buildOutboxSnapshot } from "@/app/core-logic/contextWL/outboxWl/utils/outboxSnapshot";

const trackedActions = [
	enqueueCommitted,
	markProcessing,
	markFailed,
	dequeueCommitted,
	markAwaitingAck,
	dropCommitted,
	scheduleRetry,
	outboxSuspendRequested,
	outboxResumeRequested,
];

export const outboxPersistenceMiddlewareFactory = (deps: OutboxPersistenceDeps) => {
	let pending: ReturnType<typeof setTimeout> | null = null;

	const persistSnapshot = async (api: OutboxListenerApi, deps: OutboxPersistenceDeps): Promise<void> => {
		if (pending) clearTimeout(pending);
		pending = setTimeout(async () => {
			const root = api.getState();
			const state = selectOutbox(root);
			if (!state) return;

			const snapshot = buildOutboxSnapshot(state);

			try {
				await deps.storage.saveSnapshot(snapshot);
			} catch (error) {
				deps.logger?.("[outbox] failed to persist", error);
			}
		}, 75);
	};

	const middleware = createListenerMiddleware();
	const startListening = middleware.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	startListening({
		matcher: isAnyOf(...trackedActions),
		effect: async (_, api) => {
			await persistSnapshot(api, deps);
		},
	});

	startListening({
		actionCreator: outboxRehydrateCommitted,
		effect: () => {
			// rien à persister quand on réhydrate
		},
	});

	return middleware.middleware;
};

