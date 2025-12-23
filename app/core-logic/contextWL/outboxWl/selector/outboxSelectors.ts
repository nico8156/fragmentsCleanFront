import type { RootStateWl } from "@/app/store/reduxStoreWl";
import type { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const selectOutbox = (s: RootStateWl): OutboxStateWl => {
    return (s as any).oState as OutboxStateWl;
};

export const selectOutboxQueue = (s: RootStateWl): OutboxStateWl["queue"] =>
    selectOutbox(s).queue;

export const selectOutboxById = (s: RootStateWl): OutboxStateWl["byId"] =>
    selectOutbox(s).byId;
