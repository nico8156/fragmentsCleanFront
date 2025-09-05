import {TicketMeta} from "@/app/store/appState";

export interface RemoteTicketMetaGateway {
    upsert(t: TicketMeta): Promise<void>;
    patch(id: string, changes: Partial<TicketMeta>): Promise<void>;
    getAsset(ticketId: string): Promise<{ fileUri: string; thumbUri: string } | null>;
    list(offset: number, limit: number): Promise<TicketMeta[]>;
}