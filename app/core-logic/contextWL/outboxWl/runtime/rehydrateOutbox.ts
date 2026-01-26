import type { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { outboxRehydrateCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {
	OutboxRecord,
	OutboxStateWl,
	statusTypes,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

type RehydrateOutboxDeps = {
	storage: OutboxStorageGateway;
	logger?: (message: string, payload?: unknown) => void;
};

const isStatus = (x: any) => Object.values(statusTypes).includes(x);

const sanitizeRecord = (record: any): OutboxRecord | null => {
	if (!record || typeof record !== "object") return null;
	if (typeof record.id !== "string") return null;

	const item = record.item;
	if (!item || typeof item !== "object") return null;

	const cmd = item.command;
	if (!cmd || typeof cmd !== "object") return null;

	const status = isStatus(record.status) ? record.status : statusTypes.queued;
	const attempts =
		typeof record.attempts === "number" && Number.isFinite(record.attempts) && record.attempts >= 0
			? record.attempts
			: 0;
	const enqueuedAt =
		typeof record.enqueuedAt === "string"
			? record.enqueuedAt
			: new Date().toISOString();

	const nextCheckAt =
		typeof record.nextCheckAt === "string"
			? record.nextCheckAt
			: // compat: si tu as un vieux champ ackByIso
			typeof record.ackByIso === "string"
				? record.ackByIso
				: undefined;

	const nextAttemptAt =
		typeof record.nextAttemptAt === "number" && Number.isFinite(record.nextAttemptAt)
			? record.nextAttemptAt
			: // compat: si tu as un nouveau champ nextAttemptAtMs
			typeof record.nextAttemptAtMs === "number" && Number.isFinite(record.nextAttemptAtMs)
				? record.nextAttemptAtMs
				: undefined;

	const lastError = typeof record.lastError === "string" ? record.lastError : undefined;

	return {
		id: record.id,
		item: { command: cmd, undo: item.undo ?? {} },
		status,
		attempts,
		enqueuedAt,
		nextCheckAt,
		nextAttemptAt,
		lastError,
	};
};

const emptyState = (): OutboxStateWl => ({
	byId: {},
	queue: [],
	byCommandId: {},
	suspended: false,
});

const sanitizeOutboxState = (snapshot: any): OutboxStateWl => {
	if (!snapshot || typeof snapshot !== "object") return emptyState();

	const sanitizedById: Record<string, OutboxRecord> = {};
	if (snapshot.byId && typeof snapshot.byId === "object") {
		for (const [id, record] of Object.entries(snapshot.byId)) {
			const sanitized = sanitizeRecord(record);
			if (sanitized) sanitizedById[id] = sanitized;
		}
	}

	const rawQueue = Array.isArray(snapshot.queue)
		? snapshot.queue.filter((id: any): id is string => typeof id === "string")
		: [];

	// queue = uniquement ids existants + queued
	const sanitizedQueue = rawQueue.filter(
		(id) => Boolean(sanitizedById[id]) && sanitizedById[id].status === statusTypes.queued,
	);

	const sanitizedByCommandId: Record<string, string> = {};
	if (snapshot.byCommandId && typeof snapshot.byCommandId === "object") {
		for (const [commandId, value] of Object.entries(snapshot.byCommandId)) {
			if (typeof value === "string" && sanitizedById[value]) {
				sanitizedByCommandId[commandId] = value;
			}
		}
	}

	return {
		byId: sanitizedById,
		queue: sanitizedQueue,
		byCommandId: sanitizedByCommandId,
		suspended: Boolean(snapshot.suspended ?? false),
	};
};

export const rehydrateOutboxFactory = ({ storage, logger }: RehydrateOutboxDeps) => {
	const loadSnapshot = async (): Promise<OutboxStateWl> => {
		logger?.("[outbox] rehydrate: read from storage");
		try {
			const snapshot = await storage.loadSnapshot();
			const sanitized = sanitizeOutboxState(snapshot);
			logger?.("[outbox] rehydrate: loaded", { queue: sanitized.queue.length });
			return sanitized;
		} catch (error) {
			logger?.("[outbox] rehydrate: failed to load snapshot", error);
			return emptyState();
		}
	};

	return async (store: ReduxStoreWl): Promise<OutboxStateWl> => {
		const sanitized = await loadSnapshot();
		store.dispatch(outboxRehydrateCommitted(sanitized));
		return sanitized;
	};
};
