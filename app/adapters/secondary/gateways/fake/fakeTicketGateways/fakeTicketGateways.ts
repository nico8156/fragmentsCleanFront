import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";

export class FakeCamera implements CameraGateway {
    uri = "file:///tmp/src.jpg"; delayMs = 0; willFail = false;
    async capture() {
        if (this.delayMs) await new Promise(r=>setTimeout(r,this.delayMs));
        if (this.willFail) throw new Error("camera");
        return { localUri: this.uri };
    }
}
export class FakeStorage implements PhotoStorageGateway {
    map = new Map<string,{fileUri:string;thumbUri:string}>(); delayMs=0;
    async savePhoto(_src: string, id: string) {
        if (this.delayMs) await new Promise(r=>setTimeout(r,this.delayMs));
        const val = { fileUri: `file:///app/tickets/${id}.jpg`, thumbUri: `file:///app/tickets/thumbs/${id}.jpg` };
        this.map.set(id, val); return val;
    }
    async deletePhoto() {}
}
export class FakeRepo implements RemoteTicketMetaGateway {
    byId = new Map<string, any>();
    async upsert(t:any){ this.byId.set(t.ticketId, {...this.byId.get(t.ticketId), ...t}); }
    async patch(id:string, c:any){ const cur=this.byId.get(id)||{}; this.byId.set(id, {...cur, ...c}); }
    async get(id:string){ return this.byId.get(id) ?? null; }
    async list(offset=0, limit=50){
        const arr = Array.from(this.byId.values()).sort((a,b)=>b.createdAt-a.createdAt);
        return arr.slice(offset, offset+limit);
    }
}
export class FakeUploader implements TicketUploadGateway {
    delayMs=0; remoteId="r-1"; willFail=false;
    subscribers = new Map<string,(p:{valid:boolean;data?:any;reason?:string})=>void>();
    async upload(_f:string, onProgress:(n:number)=>void){
        onProgress(10); onProgress(60); onProgress(100);
        if (this.delayMs) await new Promise(r=>setTimeout(r,this.delayMs));
        if (this.willFail) throw new Error("upload");
        return { remoteId: this.remoteId };
    }
    subscribeValidation(remoteId: string, cb:(p:{valid:boolean;data?:any;reason?:string})=>void){
        this.subscribers.set(remoteId, cb);
        return () => this.subscribers.delete(remoteId);
    }
    emit(remoteId:string, payload:{valid:boolean;data?:any;reason?:string}) {
        this.subscribers.get(remoteId)?.(payload);
    }
}
