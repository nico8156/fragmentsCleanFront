import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export interface OutboxStorageGateway {
    loadSnapshot(userId?: string): Promise<OutboxStateWl | null>;
    saveSnapshot(snapshot: OutboxStateWl, userId?: string): Promise<void>;
    clear(userId?: string): Promise<void>;
}
