import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { createAction } from "@reduxjs/toolkit";

import { CameraGateway } from "../../gateways/cameraGateway";
import { PhotoStorageGateway } from "../../gateways/photoStorageGateway";
import { TicketUploadGateway } from "../../gateways/ticketUploadGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";

export const captureRequested   = createAction("ticket/CAPTURE_REQUESTED");
export const photoCaptured      = createAction<{ ticketId: string; createdAt: number; localUri: string; thumbUri: string }>("ticket/PHOTO_CAPTURED");
export const uploadRequested    = createAction<{ ticketId: string }>("ticket/UPLOAD_REQUESTED");
export const uploadProgressed   = createAction<{ ticketId: string; pct: number }>("ticket/UPLOAD_PROGRESS");
export const uploadSucceeded    = createAction<{ ticketId: string; remoteId: string }>("ticket/UPLOAD_SUCCEEDED");
export const uploadFailed       = createAction<{ ticketId: string; reason: string }>("ticket/UPLOAD_FAILED");
export const validationReceived = createAction<{ ticketId: string; valid: boolean; data?: Partial<{ cafeName: string; amountCents: number; ticketDate: string }>; reason?: string }>("ticket/VALIDATION_RECEIVED");

export const onTicketFlowFactory = (deps: {
    camera: CameraGateway;
    storage: PhotoStorageGateway;
    repo: RemoteTicketMetaGateway;
    uploader: TicketUploadGateway;
    done?: () => void;
}) => {
    const mw = createListenerMiddleware();
    const listen = mw.startListening as TypedStartListening<any, any>;

    listen({
        actionCreator: captureRequested,
        effect: async (_a, api) => {
            const ticketId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const now = Date.now();
            try {
                const { localUri } = await deps.camera.capture();
                const { fileUri, thumbUri } = await deps.storage.savePhoto(localUri, ticketId);
                await deps.repo.upsert({ ticketId, createdAt: now, status: "captured", localUri: fileUri, thumbUri });
                api.dispatch(photoCaptured({ ticketId, createdAt: now, localUri: fileUri, thumbUri }));
                api.dispatch(uploadRequested({ ticketId }));
            } catch {
                api.dispatch(uploadFailed({ ticketId, reason: "CAPTURE_OR_SAVE_ERROR" }));
            }
        },
    });

    listen({
        actionCreator: uploadRequested,
        effect: async (a, api) => {
            const { ticketId } = a.payload;
            try {
                const t = await deps.repo.get(ticketId);
                if (!t?.localUri) { api.dispatch(uploadFailed({ ticketId, reason: "MISSING_FILE" })); return; }
                await deps.repo.patch(ticketId, { status: "uploading" });
                const { remoteId } = await deps.uploader.upload(t.localUri, (pct) =>
                    api.dispatch(uploadProgressed({ ticketId, pct }))
                );
                await deps.repo.patch(ticketId, { status: "pending", remoteId });
                api.dispatch(uploadSucceeded({ ticketId, remoteId }));

                const unsubscribe = deps.uploader.subscribeValidation(remoteId, async ({ valid, data, reason }) => {
                    await deps.repo.patch(ticketId, valid
                        ? { status: "validated", validatedAt: Date.now(), ...data }
                        : { status: "invalid", invalidReason: reason ?? "UNREADABLE" }
                    );
                    api.dispatch(validationReceived({ ticketId, valid, data, reason }));
                    try { unsubscribe?.(); } catch {}
                });
            } catch {
                api.dispatch(uploadFailed({ ticketId, reason: "UPLOAD_ERROR" }));
            } finally { deps.done?.(); }
        },
    });

    return mw;
};
