import {TicketMeta} from "@/app/store/appState";

export interface RemoteTicketMetaGateway {
    upsert(t: TicketMeta): Promise<void>;
    patch(id: string, changes: Partial<TicketMeta>): Promise<void>;
    get(id: string): Promise<TicketMeta | null>;
    list(offset: number, limit: number): Promise<TicketMeta[]>;
}