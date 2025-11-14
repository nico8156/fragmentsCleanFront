import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { SyncEventsGateway, isCursorUnknownError } from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import { createEventsApplier } from "@/app/core-logic/contextWL/outboxWl/runtime/eventsApplier";
import { SyncMetaStorage } from "@/app/core-logic/contextWL/outboxWl/runtime/syncMetaStorage";
import {
    replayRequested,
    syncDecideRequested,
    syncDeltaRequested,
    syncFullRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { SyncResponse } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const MIN_INTERVAL = 250;

type SyncStrategy = "delta" | "full" | "deltaWithFallback";
type RequestedStrategy = "decide" | "delta" | "full";

type SyncRuntimeListenerDeps = {
    eventsGateway: SyncEventsGateway;
    metaStorage: SyncMetaStorage;
    nowMs?: () => number;
    getSessionStamp?: (state: RootStateWl) => string | undefined;
    logger?: (message: string, payload?: unknown) => void;
};

const defaultSessionStamp = (state: RootStateWl) => {
    const session = state?.aState?.session;
    if (!session) return undefined;
    return `${session.userId}:${session.tokens?.issuedAt ?? "0"}`;
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
        if (!logger) return;
        logger(message, payload);
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

    const shouldSkip = (now: number) => {
        return now - lastSyncCompletedAt < MIN_INTERVAL;
    };

    const resolveStrategy = (
        requested: RequestedStrategy,
        sessionStamp: string | undefined,
        now: number,
    ): SyncStrategy => {
        const meta = metaStorage.getSnapshot();
        if (requested === "full") return "full";
        if (!meta.cursor) return "full";
        const sessionChanged = Boolean(meta.sessionId && sessionStamp && meta.sessionId !== sessionStamp);
        const idleSince = meta.lastActiveAt ? now - meta.lastActiveAt : Number.POSITIVE_INFINITY;

        if (sessionChanged) {
            return "full";
        }
        if (requested === "delta") {
            return "delta";
        }
        if (!Number.isFinite(idleSince) || Number.isNaN(idleSince)) {
            return "full";
        }
        if (idleSince > THIRTY_MINUTES) {
            return "full";
        }
        if (idleSince > FIVE_MINUTES) {
            return "deltaWithFallback";
        }
        return "delta";
    };

    const runSync = async (requested: RequestedStrategy, api: ListenerApi) => {
        await ensureLoaded();
        const now = nowMs();
        if (requested === "decide" && shouldSkip(now)) {
            return;
        }
        if (inFlight) {
            await inFlight;
            return;
        }

        const promise = (async () => {
            const sessionStamp = getSessionStamp(api.getState());
            const strategy = resolveStrategy(requested, sessionStamp, now);
            const snapshotBefore = metaStorage.getSnapshot();
            const applyEvents = createEventsApplier(api.dispatch, metaStorage);

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
                await applyEvents(response!.events);
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
        const applyEvents = createEventsApplier(api.dispatch, metaStorage);
        await applyEvents(replay.events);
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
