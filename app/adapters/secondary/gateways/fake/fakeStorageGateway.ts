import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";

export class FakeStorage implements PhotoStorageGateway {
    map = new Map<string,{fileUri:string;thumbUri:string}>(); delayMs=0;
    async savePhoto(src: string, id: string) {
        if (this.delayMs) await new Promise(r=>setTimeout(r,this.delayMs));
        const val = { fileUri: `file:///app/tickets/${id}.jpg`, thumbUri: `file:///app/tickets/thumbs/${id}.jpg` };
        this.map.set(id, val); return val;
    }
    async deletePhoto() {}
}