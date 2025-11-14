import { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { SyncEventsGateway, isCursorUnknownError } from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import {
    createDefaultSyncMeta,
    SyncMetaStorage,
    SyncMetaState,
} from "@/app/core-logic/contextWL/outboxWl/runtime/syncMetaStorage";
import { createEventsApplier } from "@/app/core-logic/contextWL/outboxWl/runtime/eventsApplier";
import { SyncResponse } from "@/app/core-logic/contextWL/outboxWl/runtime/syncEvents";

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

const defaultSessionStamp = (state: ReturnType<ReduxStoreWl["getState"]>) => {
    const session = state?.aState?.session;
    if (!session) return "anonymous";
    return `${session.userId}:${session.tokens?.issuedAt ?? "0"}`;
};

type RuntimeDeps = {
    store: ReduxStoreWl;
    eventsGateway: SyncEventsGateway;
    metaStorage: SyncMetaStorage;
    nowMs?: () => number;
    nowIso?: () => string;
    getSessionStamp?: typeof defaultSessionStamp;
    logger?: (message: string, payload?: unknown) => void;
};

export type SyncRuntime = {
    replayLocal: () => Promise<void>;
    decideAndSync: () => Promise<void>;
    teardown: () => void;
};

export const createSyncRuntime = ({
    store,
    eventsGateway,
    metaStorage,
    nowMs = () => Date.now(),
    nowIso = () => new Date().toISOString(),
    getSessionStamp = defaultSessionStamp,
    logger,
}: RuntimeDeps): SyncRuntime => {
    let meta: SyncMetaState = createDefaultSyncMeta();
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
                const stored = await metaStorage.load();
                meta = stored ?? createDefaultSyncMeta();
                loaded = true;
            })();
        }
        await loadPromise;
    };

    const updateMeta = async (updater: (current: SyncMetaState) => SyncMetaState) => {
        meta = updater(meta);
        await metaStorage.save(meta);
    };

    const applyEvents = createEventsApplier(store.dispatch, () => meta, updateMeta);

    const shouldSkip = (now: number) => {
        if (now - lastSyncCompletedAt < 250) {
            return true;
        }
        return false;
    };

    const runSync = async () => {
        await ensureLoaded();
        const now = nowMs();
        if (shouldSkip(now)) return;
        if (inFlight) {
            await inFlight;
            return;
        }
        const promise = (async () => {
            const sessionStamp = getSessionStamp(store.getState());
            const idleSince = meta.lastActiveAt ? now - Date.parse(meta.lastActiveAt) : Number.POSITIVE_INFINITY;
            const sessionChanged = meta.sessionId && meta.sessionId !== sessionStamp;
            let strategy: "full" | "delta" | "deltaWithFallback" = "delta";

            if (!meta.cursor) {
                strategy = "full";
            } else if (sessionChanged) {
                strategy = "full";
            } else if (!Number.isFinite(idleSince) || Number.isNaN(idleSince)) {
                strategy = "full";
            } else if (idleSince > THIRTY_MINUTES) {
                strategy = "full";
            } else if (idleSince > FIVE_MINUTES) {
                strategy = "deltaWithFallback";
            } else {
                strategy = "delta";
            }

            const performSync = async (): Promise<SyncResponse> => {
                if (strategy === "full") {
                    log("[runtime] sync full");
                    return eventsGateway.syncFull();
                }
                log("[runtime] sync delta", { cursor: meta.cursor });
                return eventsGateway.syncDelta({ cursor: meta.cursor });
            };

            let response: SyncResponse | null = null;
            try {
                response = await performSync();
            } catch (error) {
                if (strategy === "deltaWithFallback" && isCursorUnknownError(error)) {
                    log("[runtime] cursor unknown, fallback to full");
                    response = await eventsGateway.syncFull();
                } else {
                    throw error;
                }
            }

            if (response.events.length) {
                await applyEvents(response.events);
            }

            const isoTimestamp = nowIso();
            await updateMeta((current) => ({
                ...current,
                cursor: response.cursor ?? current.cursor,
                lastActiveAt: isoTimestamp,
                sessionId: sessionStamp,
            }));

            lastSyncCompletedAt = nowMs();
        })()
            .catch((error) => {
                log("[runtime] sync failed", error);
            })
            .finally(() => {
                inFlight = null;
            });
        inFlight = promise;
        await promise;
    };

    const replayLocal = async () => {
        await ensureLoaded();
        const replay = await eventsGateway.replayLocal();
        if (replay.events.length) {
            await applyEvents(replay.events);
        }
    };

    const teardown = () => {
        loadPromise = null;
        inFlight = null;
    };

    return {
        replayLocal,
        decideAndSync: runSync,
        teardown,
    };
};
