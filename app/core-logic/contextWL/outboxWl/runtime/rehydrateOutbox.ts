import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { OutboxStateWl, OutboxRecord, statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { outboxRehydrateCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

type RehydrateOutboxDeps = {
    storage: OutboxStorageGateway;
    logger?: (message: string, payload?: unknown) => void;
};

const sanitizeRecord = (record: any): OutboxRecord | null => {
    if (!record || typeof record !== "object") return null;
    if (typeof record.id !== "string") return null;
    if (!record.item || typeof record.item !== "object") return null;
    if (!record.item.command || typeof record.item.command !== "object") return null;
    if (!record.item.undo || typeof record.item.undo !== "object") return null;
    const status = Object.values(statusTypes).includes(record.status) ? record.status : statusTypes.queued;
    const attempts = typeof record.attempts === "number" && Number.isFinite(record.attempts) ? record.attempts : 0;
    const enqueuedAt = typeof record.enqueuedAt === "string" ? record.enqueuedAt : new Date().toISOString();
    const nextCheckAt = typeof record.nextCheckAt === "string" ? record.nextCheckAt : undefined;
    const lastError = typeof record.lastError === "string" ? record.lastError : undefined;
    return {
        id: record.id,
        item: record.item,
        status,
        attempts,
        enqueuedAt,
        nextCheckAt,
        lastError,
    };
};

const sanitizeOutboxState = (snapshot: OutboxStateWl | null | undefined): OutboxStateWl => {
    if (!snapshot || typeof snapshot !== "object") {
        return {
            byId: {},
            queue: [],
            byCommandId: {},
        };
    }
    const sanitizedById: Record<string, OutboxRecord> = {};
    if (snapshot.byId && typeof snapshot.byId === "object") {
        for (const [id, record] of Object.entries(snapshot.byId)) {
            const sanitized = sanitizeRecord(record);
            if (sanitized) {
                sanitizedById[id] = sanitized;
            }
        }
    }
    const sanitizedQueue = Array.isArray(snapshot.queue) ? snapshot.queue.filter((id): id is string => typeof id === "string") : [];
    const sanitizedByCommandId: Record<string, string> = {};
    if (snapshot.byCommandId && typeof snapshot.byCommandId === "object") {
        for (const [commandId, value] of Object.entries(snapshot.byCommandId)) {
            if (typeof value === "string") {
                sanitizedByCommandId[commandId] = value;
            }
        }
    }
    return {
        byId: sanitizedById,
        queue: sanitizedQueue,
        byCommandId: sanitizedByCommandId,
    };
};

export const rehydrateOutboxFactory = ({ storage, logger }: RehydrateOutboxDeps) => {
    const loadSnapshot = async (): Promise<OutboxStateWl> => {
        let snapshot: OutboxStateWl | null = null;
        try {
            snapshot = await storage.loadSnapshot();
        } catch (error) {
            logger?.("[outbox] failed to load snapshot", error);
        }
        return sanitizeOutboxState(snapshot ?? undefined);
    };

    return async (store: ReduxStoreWl): Promise<OutboxStateWl> => {
        const sanitized = await loadSnapshot();
        store.dispatch(outboxRehydrateCommitted(sanitized));
        return sanitized;
    };
};
