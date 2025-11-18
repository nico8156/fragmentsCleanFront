import {SyncEventsGateway} from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import {SyncEvent} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";

export class RecordingGateway implements SyncEventsGateway {
    deltaCalls = 0;
    fullCalls = 0;
    replayCalls = 0;
    eventsForReplay: SyncEvent[] = [];

    constructor(private readonly options: { deltaError?: Error } = {}) {}

    async replayLocal() {
        this.replayCalls += 1;
        return { events: this.eventsForReplay };
    }

    async syncDelta() {
        this.deltaCalls += 1;
        if (this.options.deltaError) {
            throw this.options.deltaError;
        }
        return { events: [], cursor: "cursor_delta", sessionId: "remote" };
    }

    async syncFull() {
        this.fullCalls += 1;
        return { events: [], cursor: "cursor_full", sessionId: "remote" };
    }
}