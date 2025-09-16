import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";
import {TicketMeta} from "@/app/store/appState";

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

export class FakeValidityGateway implements TicketUploadGateway{
    public willFailUpload = false;
    public progressSteps: number[] = [0, 100];

    subscribeValidation(remoteId: string, onResult: (p: { valid: boolean; data?: any; reason?: string; }) => void): () => void {
        throw new Error("Method not implemented.");
    }
    async upload(
        localUri: string,
        onProgress: (pct: number) => void
    ): Promise<{ remoteId: string }> {
        for (const p of this.progressSteps) onProgress(p);
        if (this.willFailUpload) throw new Error("fail-upload");
        return { remoteId: `r-${Math.random().toString(16).slice(2)}` };
    }
}
export class FakeRemoteTicketMetaGateway implements RemoteTicketMetaGateway {
    verify(result: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public willFailOnGet = false;
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
        if (this.willFailOnGet) throw new Error("fail-get");

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
function delay(ms: number) {
    return new Promise<void>(res => setTimeout(res, ms));
}
