import {OutboxStorageGateway} from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import {OutboxStateWl} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export class FakeOutboxStorage implements OutboxStorageGateway {
    loadResult: OutboxStateWl | null = null;
    failOnLoad = false;
    failOnSave = false;
    cleared = false;
    savedSnapshots: OutboxStateWl[] = [];

    async loadSnapshot(): Promise<OutboxStateWl | null> {
        if (this.failOnLoad) {
            throw new Error("load failed");
        }
        return this.loadResult;
    }

    async saveSnapshot(snapshot: OutboxStateWl): Promise<void> {
        if (this.failOnSave) {
            throw new Error("save failed");
        }
        this.savedSnapshots.push(snapshot);
    }

    async clear(): Promise<void> {
        this.cleared = true;
        this.loadResult = null;
        this.savedSnapshots = [];
    }
}
export class FakeLogger {
    logs: { message: string; payload?: unknown }[] = [];

    log(message: string, payload?: unknown) {
        this.logs.push({ message, payload });
    }
}

