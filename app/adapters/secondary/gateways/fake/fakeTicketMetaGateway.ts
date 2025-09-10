// fakeTicketGateways.ts
import { TicketMeta } from "@/app/store/appState";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";
import { Meta } from "./fakeTicketGateways/fakeTicketGateways";

export class FakeRemoteTicketMetaGateway implements RemoteTicketMetaGateway {
    list(offset: number, limit: number): Promise<Meta[]> {
        throw new Error("Method not implemented.");
    }
    public willFailOnUpsert = false;
    public willFailOnPatchUploading = false;
    public willFailOnPatchPending = false;

    private store: Record<string, TicketMeta> = {};

    async upsert(meta: TicketMeta): Promise<void> {
        if (this.willFailOnUpsert) throw new Error("fail-upsert");
        const prev = this.store[meta.ticketId] ?? ({} as TicketMeta);
        this.store[meta.ticketId] = { ...prev, ...meta };
    }

    async get(ticketId: string): Promise<TicketMeta | undefined> {
        return this.store[ticketId];
    }

    async patch(ticketId: string, patch: Partial<TicketMeta>): Promise<void> {
        const current = this.store[ticketId] ?? ({ ticketId } as TicketMeta);

        if (patch.status === "uploading" && this.willFailOnPatchUploading) {
            throw new Error("fail-patch-uploading");
        }
        if (patch.status === "pending" && this.willFailOnPatchPending) {
            throw new Error("fail-patch-pending");
        }

        this.store[ticketId] = { ...current, ...patch };
    }
}
