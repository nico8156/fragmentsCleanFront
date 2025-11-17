// runtime/outboxPersistence.types.ts
import type { ListenerEffectAPI } from "@reduxjs/toolkit";
import type { RootStateWl, AppDispatchWl } from "@/app/store/reduxStoreWl";
import type { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import {SyncMetaState} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncMeta.types";


export type OutboxListenerApi = ListenerEffectAPI<RootStateWl, AppDispatchWl>;

export type OutboxPersistenceDeps = {
    storage: OutboxStorageGateway;
    logger?: (message: string, payload?: unknown) => void;
};

export type PersistedState = SyncMetaState;

export type StorageDriver = {
    load(): Promise<PersistedState | null>;
    save(state: PersistedState): Promise<void>;
    clear(): Promise<void>;
};