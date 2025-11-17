// runtime/outboxSnapshot.ts
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const buildOutboxSnapshot = (state: OutboxStateWl): OutboxStateWl => {
    const safeState: OutboxStateWl = {
        byId: state.byId ?? {},
        byCommandId: state.byCommandId ?? {},
        queue: Array.isArray(state.queue) ? state.queue : [],
    };
    // clone profond pour ne pas leak des références
    return JSON.parse(JSON.stringify(safeState)) as OutboxStateWl;
};
