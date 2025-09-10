import {AppThunk} from "@/app/store/reduxStore";

import {createAction} from "@reduxjs/toolkit";

export const photoCaptured      = createAction<{ ticketId: string; createdAt: number; localUri: string; thumbUri: string }>("ticket/PHOTO_CAPTURED");
export const uploadProgressed   = createAction<{ ticketId: string; pct: number }>("ticket/UPLOAD_PROGRESS");
export const uploadSucceeded    = createAction<{ ticketId: string; remoteId: string }>("ticket/UPLOAD_SUCCEEDED");
export const uploadFailed       = createAction<{ ticketId: string; reason: string }>("ticket/UPLOAD_FAILED");
export const validationReceived = createAction<{ ticketId: string; valid: boolean; data?: Partial<{ cafeName: string; amountCents: number; ticketDate: string }>; reason?: string }>("ticket/VALIDATION_RECEIVED");
export const uploadRequested = createAction<{ ticketId: string }>("ticket/uploadRequested");


export const captureRequested =
    (): AppThunk<Promise<void>> =>
        async (dispatch, _, { cameraGateway, storageGateway, ticketApiGateway }) => {
            const ticketId =
                globalThis.crypto?.randomUUID?.() ??
                `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const now = Date.now();

            // 1) Bloc capture/sauvegarde/creation
            try {
                const { localUri } = await cameraGateway.capture();
                const { fileUri, thumbUri } = await storageGateway.savePhoto(localUri, ticketId);
                await ticketApiGateway.upsert({
                    ticketId,
                    createdAt: now,
                    status: "captured",
                    localUri: fileUri,
                    thumbUri,
                });
                dispatch(photoCaptured({ ticketId, createdAt: now, localUri: fileUri, thumbUri }));
            } catch {
                dispatch(uploadFailed({ ticketId, reason: "CAPTURE_OR_SAVE_ERROR" }));
                return; // on arrête ici en cas d'échec de capture/sauvegarde
            }

            // 2) Bloc upload (et seulement upload) — ses erreurs doivent donner UPLOAD_ERROR
            await dispatch(performUpload({ ticketId }));
        };

export const performUpload = (id: { ticketId: string }): AppThunk<Promise<void>> =>
    async (dispatch, _, { ticketApiGateway, validityGateway }) => {

        const { ticketId } = id;
        try {
            dispatch(uploadRequested({ ticketId }));
            const meta = await ticketApiGateway.get(ticketId);
            if (!meta?.localUri) {
                dispatch(uploadFailed({ ticketId, reason: "MISSING_FILE" }));
                return;
            }
            await ticketApiGateway.patch(ticketId, { status: "uploading" });
            const { remoteId } = await validityGateway.upload(meta.localUri, (pct) =>
                dispatch(uploadProgressed({ ticketId, pct })),
            );
            await ticketApiGateway.patch(ticketId, { status: "pending", remoteId });
            dispatch(uploadSucceeded({ ticketId, remoteId }));
        } catch {
            dispatch(uploadFailed({ ticketId, reason: "UPLOAD_ERROR" }));
        }
    };
