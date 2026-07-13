import type { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { outboxDevClearCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import type { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

type DevToolsLogger = {
	info: (message: string, payload?: unknown) => void;
	warn: (message: string, payload?: unknown) => void;
};

type OutboxDevToolsDeps = {
	store: ReduxStoreWl;
	outboxStorage: OutboxStorageGateway;
	logger: DevToolsLogger;
};

type FragmentsDevGlobal = typeof globalThis & {
	__FRAGMENTS_DEV__?: {
		clearOutbox?: () => Promise<void>;
		printOutbox?: () => OutboxStateWl;
	};
};

export const clearOutboxForDev = async ({
	store,
	outboxStorage,
	logger,
}: OutboxDevToolsDeps): Promise<void> => {
	await outboxStorage.clear();
	store.dispatch(outboxDevClearCommitted());
	logger.warn("[OUTBOX_DEV] local outbox cleared");
};

export const installOutboxDevTools = (deps: OutboxDevToolsDeps): (() => void) => {
	if (__DEV__ !== true) return () => undefined;

	const root = globalThis as FragmentsDevGlobal;
	const previous = root.__FRAGMENTS_DEV__;
	const next = {
		...(previous ?? {}),
		clearOutbox: () => clearOutboxForDev(deps),
		printOutbox: () => deps.store.getState().oState,
	};

	root.__FRAGMENTS_DEV__ = next;
	deps.logger.info("[OUTBOX_DEV] helpers installed", {
		clear: "globalThis.__FRAGMENTS_DEV__.clearOutbox()",
		print: "globalThis.__FRAGMENTS_DEV__.printOutbox()",
	});

	return () => {
		if (root.__FRAGMENTS_DEV__ === next) {
			root.__FRAGMENTS_DEV__ = previous;
		}
	};
};
