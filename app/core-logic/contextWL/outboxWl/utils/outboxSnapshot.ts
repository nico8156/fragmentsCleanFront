import type { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const buildOutboxSnapshot = (state: OutboxStateWl): OutboxStateWl => {
	const byId = state.byId ?? {};
	const byCommandId = state.byCommandId ?? {};
	const queue = Array.isArray(state.queue) ? state.queue : [];

	// clone pour éviter de persister des refs immer / stateful
	const clonedById: OutboxStateWl["byId"] = {};
	for (const [id, rec] of Object.entries(byId)) {
		clonedById[id] = {
			...rec,
			item: {
				command: (rec.item as any)?.command,
				undo: (rec.item as any)?.undo,
			},
		};
	}

	return {
		byId: clonedById,
		byCommandId: { ...byCommandId },
		queue: [...queue],
		suspended: Boolean(state.suspended),
	};
};
