// runtime/syncRuntimeListenerFactory.ts
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { SyncEventsGateway, isCursorUnknownError } from "../gateway/eventsGateway";

import {
    replayRequested,
    syncDecideRequested,
    syncDeltaRequested,
    syncFullRequested,
    syncEventsReceived,
} from "../typeAction/sync.action";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import type { SyncResponse } from "../typeAction/syncEvent.type";
import {
    resolveStrategy,
    shouldSkip,
    RequestedStrategy,
    defaultSessionStamp,
} from "./syncStrategy";
import {SyncMetaStorage} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncMeta.types";

type SyncRuntimeListenerDeps = {
    eventsGateway: SyncEventsGateway;
    metaStorage: SyncMetaStorage;
    nowMs?: () => number;
    getSessionStamp?: (state: RootStateWl) => string | undefined;
    logger?: (message: string, payload?: unknown) => void;
};

export const syncRuntimeListenerFactory = ({
                                               eventsGateway,
                                               metaStorage,
                                               nowMs = () => Date.now(),
                                               getSessionStamp = defaultSessionStamp,
                                               logger,
                                           }: SyncRuntimeListenerDeps) => {
    const middleware = createListenerMiddleware();
    const startListening = middleware.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

    type ListenerApi = Parameters<Parameters<typeof startListening>[0]["effect"]>[1];

    let loaded = false;
    let loadPromise: Promise<void> | null = null;
    let inFlight: Promise<void> | null = null;
    let lastSyncCompletedAt = 0;

    const log = (message: string, payload?: unknown) => {
        logger?.(message, payload);
    };

    const ensureLoaded = async () => {
        if (loaded) return;
        if (!loadPromise) {
            loadPromise = (async () => {
                await metaStorage.loadOrDefault();
                loaded = true;
            })();
        }
        await loadPromise;
    };

    const runSync = async (requested: RequestedStrategy, api: ListenerApi) => {
        await ensureLoaded();
        const now = nowMs();

        if (requested === "decide" && shouldSkip(lastSyncCompletedAt, now)) {
            return;
        }
        if (inFlight) {
            await inFlight;
            return;
        }

        const promise = (async () => {
            const sessionStamp = getSessionStamp(api.getState());
            const strategy = resolveStrategy(requested, metaStorage, sessionStamp, now);
            const snapshotBefore = metaStorage.getSnapshot();

            const performSync = async (): Promise<SyncResponse> => {
                if (strategy === "full") {
                    log("[sync] full", { cursor: snapshotBefore.cursor });
                    return eventsGateway.syncFull();
                }
                log("[sync] delta", { cursor: snapshotBefore.cursor });
                return eventsGateway.syncDelta({ cursor: snapshotBefore.cursor ?? null });
            };

            let response: SyncResponse | null = null;
            try {
                response = await performSync();
            } catch (error) {
                if (strategy === "deltaWithFallback" && isCursorUnknownError(error)) {
                    log("[sync] cursor unknown, fallback to full");
                    response = await eventsGateway.syncFull();
                } else {
                    throw error;
                }
            }

            if (response!.events.length) {
                api.dispatch(syncEventsReceived(response!.events));
            }

            await metaStorage.setCursor(response!.cursor ?? snapshotBefore.cursor);
            await metaStorage.updateLastActiveAt(now);
            await metaStorage.setSessionId(sessionStamp);

            lastSyncCompletedAt = nowMs();
        })()
            .catch((error) => {
                log("[sync] failed", error);
            })
            .finally(() => {
                inFlight = null;
            });

        inFlight = promise;
        await promise;
    };

    const runReplay = async (api: ListenerApi) => {
        await ensureLoaded();
        const replay = await eventsGateway.replayLocal();
        if (!replay.events.length) return;
        api.dispatch(syncEventsReceived(replay.events));
    };

    startListening({
        actionCreator: replayRequested,
        effect: async (_, api) => {
            try {
                await runReplay(api);
            } catch (error) {
                log("[sync] replay failed", error);
            }
        },
    });

    startListening({
        actionCreator: syncDecideRequested,
        effect: async (_, api) => {
            await runSync("decide", api);
        },
    });

    startListening({
        actionCreator: syncDeltaRequested,
        effect: async (_, api) => {
            await runSync("delta", api);
        },
    });

    startListening({
        actionCreator: syncFullRequested,
        effect: async (_, api) => {
            await runSync("full", api);
        },
    });

    return middleware;
};
