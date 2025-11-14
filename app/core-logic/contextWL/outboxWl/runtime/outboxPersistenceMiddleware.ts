import { createListenerMiddleware, isAnyOf, TypedStartListening } from "@reduxjs/toolkit";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {
    dequeueCommitted,
    dropCommitted,
    markAwaitingAck,
    markFailed,
    markProcessing,
} from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { outboxRehydrateCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

const trackedActions = [
    enqueueCommitted,
    markProcessing,
    markFailed,
    dequeueCommitted,
    markAwaitingAck,
    dropCommitted,
];

const cloneOutboxState = (state: OutboxStateWl): OutboxStateWl => {
    const safeState: OutboxStateWl = {
        byId: state.byId ?? {},
        byCommandId: state.byCommandId ?? {},
        queue: Array.isArray(state.queue) ? state.queue : [],
    };
    return JSON.parse(JSON.stringify(safeState)) as OutboxStateWl;
};

type ListenerApi = Parameters<
    Parameters<TypedStartListening<RootStateWl, AppDispatchWl>>[0]["effect"]
>[1];

type OutboxPersistenceDeps = {
    storage: OutboxStorageGateway;
    logger?: (message: string, payload?: unknown) => void;
};

const persistSnapshot = async (
    api: ListenerApi,
    deps: OutboxPersistenceDeps,
): Promise<void> => {
    const state = api.getState().oState as OutboxStateWl | undefined;
    if (!state) return;
    const snapshot = cloneOutboxState(state);
    try {
        await deps.storage.saveSnapshot(snapshot);
    } catch (error) {
        deps.logger?.("[outbox] failed to persist", error);
    }
};

export const outboxPersistenceMiddlewareFactory = (deps: OutboxPersistenceDeps) => {
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
            // Rien à persister quand on rehydrate depuis le storage.
        },
    });

    return middleware.middleware;
};
