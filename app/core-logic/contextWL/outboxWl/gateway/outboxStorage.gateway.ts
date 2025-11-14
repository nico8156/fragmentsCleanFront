import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export interface OutboxStorageGateway {
    loadSnapshot(): Promise<OutboxStateWl | null>;
    saveSnapshot(snapshot: OutboxStateWl): Promise<void>;
    clear(): Promise<void>;
}
