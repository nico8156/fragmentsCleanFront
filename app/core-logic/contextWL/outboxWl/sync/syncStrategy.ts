import type { RootStateWl } from "@/app/store/reduxStoreWl";
import {SyncMetaStorage} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncMeta.types";

export type SyncStrategy = "delta" | "full" | "deltaWithFallback";
export type RequestedStrategy = "decide" | "delta" | "full";

export const FIVE_MINUTES = 5 * 60 * 1000;
export const THIRTY_MINUTES = 30 * 60 * 1000;
export const MIN_INTERVAL = 250;

export const defaultSessionStamp = (state: RootStateWl) => {
    const session = state?.aState?.session;
    if (!session) return undefined;
    return `${session.userId}:${session.tokens?.issuedAt ?? "0"}`;
};

export const shouldSkip = (lastSyncCompletedAt: number, now: number): boolean => {
    return now - lastSyncCompletedAt < MIN_INTERVAL;
};

export const resolveStrategy = (
    requested: RequestedStrategy,
    metaStorage: SyncMetaStorage,
    sessionStamp: string | undefined,
    now: number,
): SyncStrategy => {
    const meta = metaStorage.getSnapshot();
    if (requested === "full") return "full";
    if (!meta.cursor) return "full";

    const sessionChanged = Boolean(meta.sessionId && sessionStamp && meta.sessionId !== sessionStamp);
    const idleSince = meta.lastActiveAt ? now - meta.lastActiveAt : Number.POSITIVE_INFINITY;

    if (sessionChanged) return "full";
    if (requested === "delta") return "delta";
    if (!Number.isFinite(idleSince) || Number.isNaN(idleSince)) return "full";
    if (idleSince > THIRTY_MINUTES) return "full";
    if (idleSince > FIVE_MINUTES) return "deltaWithFallback";
    return "delta";
};
