import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";

export type Meta = { ticketId: string; createdAt: number; status: string; localUri?: string; thumbUri?: string; remoteId?: string };

export class FakeCameraGateway implements CameraGateway {
    willFail = false;
    delayMs = 0;
    nextLocalUri = "local://photo";

    async capture(): Promise<{ localUri: string }> {
        await delay(this.delayMs);
        if (this.willFail) throw new Error("CAMERA_ERROR");
        return { localUri: this.nextLocalUri };
    }
}

export class FakePhotoStorageGateway implements PhotoStorageGateway {
    willFail = false;
    delayMs = 0;
    makeThumb = true;

    async savePhoto(localUri: string, ticketId: string): Promise<{ fileUri: string; thumbUri: string }> {
        await delay(this.delayMs);
        if (this.willFail) throw new Error("SAVE_ERROR");
        return {
            fileUri: `file://${ticketId}`,
            thumbUri: this.makeThumb ? `thumb://${ticketId}` : ""
        };
    }
    async deletePhoto(fileUri: string): Promise<void>{
        //TODO fake method to implement !
        return;
    }
}
export class FakeRemoteTicketMetaGateway implements RemoteTicketMetaGateway {
    db = new Map<string, Meta>();
    delayMsGet = 0;
    delayMsPatch = 0;
    delayMsUpsert = 0;

    async upsert(meta: Meta): Promise<void> {
        await delay(this.delayMsUpsert);
        this.db.set(meta.ticketId, meta);
    }

    async get(ticketId: string): Promise<Meta | undefined> {
        await delay(this.delayMsGet);
        return this.db.get(ticketId);
    }

    async patch(ticketId: string, patch: Partial<Meta>): Promise<void> {
        await delay(this.delayMsPatch);
        const current = this.db.get(ticketId) ?? ({ ticketId, createdAt: Date.now(), status: "init" } as Meta);
        this.db.set(ticketId, { ...current, ...patch });
    }
    async list(offset: number, limit: number): Promise<Meta[]> {
        return Array.from(this.db.values());
    }
}
export class FakeTicketUploadGateway implements TicketUploadGateway {
    willFail = false;
    delayBeforeFirstProgressMs = 0;
    progressSteps: number[] = [10, 50, 100]; // chiffres envoyés via onProgress
    totalDelayMs = 100;                      // temps jusqu'à la résolution
    remoteIdFactory: () => string = () => "remote-123";

    async upload(localUri: string, onProgress: (pct: number) => void): Promise<{ remoteId: string }> {
        // émettre les progress étalés sur totalDelayMs (si timers fake => jest.advanceTimersByTime)
        const slice = this.progressSteps.length ? Math.floor(this.totalDelayMs / this.progressSteps.length) : 0;

        await delay(this.delayBeforeFirstProgressMs);
        for (let i = 0; i < this.progressSteps.length; i++) {
            onProgress(this.progressSteps[i]);
            if (i < this.progressSteps.length - 1) {
                await delay(slice);
            }
        }

        if (this.willFail) throw new Error("UPLOAD_ERROR");
        return { remoteId: this.remoteIdFactory() };
    }
    subscribeValidation(remoteId: string, onResult:(p:{ valid:boolean; data?: any; reason?: string })=>void): () => void{
        //TODO see real impl
        return () => {
        }
    }
}

function delay(ms: number) {
    return new Promise<void>(res => setTimeout(res, ms));
}
