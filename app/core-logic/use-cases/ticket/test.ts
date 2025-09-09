// core-logic/use-cases/auth/onGoogleAuth.ts
import {
    createAction,
    createListenerMiddleware,
    TypedStartListening,
} from "@reduxjs/toolkit";
import { AppDispatch } from "@/app/store/reduxStore";
import {AppState} from "@/app/store/appState";
import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";

export const captureRequested   = createAction("ticket/CAPTURE_REQUESTED");
export const photoCaptured      = createAction<{ ticketId: string; createdAt: number; localUri: string; thumbUri: string }>("ticket/PHOTO_CAPTURED");
export const uploadRequested    = createAction<{ ticketId: string }>("ticket/UPLOAD_REQUESTED");
export const uploadProgressed   = createAction<{ ticketId: string; pct: number }>("ticket/UPLOAD_PROGRESS");
export const uploadSucceeded    = createAction<{ ticketId: string; remoteId: string }>("ticket/UPLOAD_SUCCEEDED");
export const uploadFailed       = createAction<{ ticketId: string; reason: string }>("ticket/UPLOAD_FAILED");
export const validationReceived = createAction<{ ticketId: string; valid: boolean; data?: Partial<{ cafeName: string; amountCents: number; ticketDate: string }>; reason?: string }>("ticket/VALIDATION_RECEIVED");

export const onTestFactory = (
    cameraGateway: CameraGateway,
    storageGateway: PhotoStorageGateway,
    ticketApiGateway: RemoteTicketMetaGateway,
    validityGateway: TicketUploadGateway,
    callback: () => void,
) => {
    const onTest = createListenerMiddleware();
    const listener = onTest.startListening as TypedStartListening<
        AppState,
        AppDispatch
    >;

    listener({
        actionCreator: captureRequested,
        effect: async (_action, api) => {
            const ticketId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const now = Date.now();
            setTimeout(async () => {
                try {
                    const { localUri } = await cameraGateway.capture();
                    const { fileUri, thumbUri } = await storageGateway.savePhoto(localUri, ticketId);
                    await ticketApiGateway.upsert({ ticketId, createdAt: now, status: "captured", localUri: fileUri, thumbUri });
                    api.dispatch(photoCaptured({ ticketId, createdAt: now, localUri: fileUri, thumbUri }));
                    api.dispatch(uploadRequested({ ticketId }));

                } catch (e: any) {
                    api.dispatch(uploadFailed({ ticketId, reason: "CAPTURE_OR_SAVE_ERROR" }));

                }
                callback();
            }, 500)
        },
    });
    listener({
        actionCreator:uploadRequested,
        effect: async (action, api) => {
            const {ticketId} = action.payload;
            setTimeout(async () => {
                try{
                    const meta = await ticketApiGateway.get(ticketId);
                    if(!meta?.localUri){
                        api.dispatch(uploadFailed({ticketId, reason: "MISSING_FILE"}));
                        return;
                    }
                    await ticketApiGateway.patch(ticketId, {status: "uploading"});
                    const {remoteId} = await validityGateway.upload(meta.localUri, (pct) =>
                        api.dispatch(uploadProgressed({ticketId, pct}))
                    );
                    await ticketApiGateway.patch(ticketId, {status: "pending", remoteId});
                    api.dispatch(uploadSucceeded({ticketId, remoteId}));
                } catch (e: any) {
                    api.dispatch(uploadFailed({ticketId, reason: "UPLOAD_ERROR"}));
                    callback();
                }
                callback();
            }, 500)

        }
    })

    return onTest;
};
