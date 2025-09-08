import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";

/*export class FakeUploader implements TicketUploadGateway {
    delayMs = 0;
    remoteId = "r-1";
    willFail = false;
    subscribers = new Map<string, (p: { valid: boolean; data?: any; reason?: string }) => void>();

    async upload(_f: string, onProgress: (n: number) => void) {
        onProgress(10);
        onProgress(60);
        onProgress(100);
        if (this.delayMs) await new Promise(r => setTimeout(r, this.delayMs));
        if (this.willFail) throw new Error("upload");
        return {remoteId: this.remoteId};
    }

    subscribeValidation(remoteId: string, cb:(p:{valid:boolean;data?:any;reason?:string})=>void){
        this.subscribers.set(remoteId, cb);
        return () => this.subscribers.delete(remoteId);
    }
    // helper test:
    emit(remoteId:string, payload:{valid:boolean;data?:any;reason?:string}) {
        this.subscribers.get(remoteId)?.(payload);
    }
}

 */