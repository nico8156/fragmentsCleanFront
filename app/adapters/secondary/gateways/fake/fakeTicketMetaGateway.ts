import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";

export class FakeRepo implements RemoteTicketMetaGateway {
    byId = new Map<string, any>();
    async upsert(t:any){ this.byId.set(t.ticketId, {...this.byId.get(t.ticketId), ...t}); }
    async patch(id:string, c:any){ const cur=this.byId.get(id)||{}; this.byId.set(id, {...cur, ...c}); }
    async get(id:string){ return this.byId.get(id) ?? null; }
    async getAsset(id:string){ return this.byId.get(id) ?? null; }
    async list(){ return Array.from(this.byId.values()); }
}