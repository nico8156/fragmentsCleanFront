import type { SyncEventsGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import type { SyncResponse } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";

export class NoopEventsGateway implements SyncEventsGateway {
    async syncFull(): Promise<SyncResponse> {
        return { cursor: null, events: [] };
    }

    async syncDelta(_params: { cursor: string | null }): Promise<SyncResponse> {
        return { cursor: null, events: [] };
    }

    async replayLocal(): Promise<{ events: SyncResponse["events"] }> {
        return { events: [] };
    }
}
