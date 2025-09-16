import {TicketMeta} from "@/app/store/appState";
import {Meta} from "@/app/adapters/secondary/gateways/fake/fakeTicketGateways";

export interface RemoteTicketMetaGateway {
    upsert(t: TicketMeta): Promise<void>;
    patch(id: string, changes: Partial<TicketMeta>): Promise<void>;
    get(ticketId: string): Promise<Meta | undefined>;
    list(offset: number, limit: number): Promise<Meta[]>;
    verify(result: string): Promise<void>;
}

