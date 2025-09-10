import {AppThunk} from "@/app/store/reduxStore";
import {photoCaptured, uploadFailed, uploadProgressed, uploadSucceeded} from "@/app/core-logic/use-cases/ticket/test";


export const captureRequested =
    (): AppThunk<Promise<void>> =>
        async (dispatch, _, { cameraGateway, storageGateway, ticketApiGateway }) => {
            const ticketId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const now = Date.now();
            try {
                const {localUri} = await cameraGateway.capture();
                const {fileUri, thumbUri} = await storageGateway.savePhoto(localUri, ticketId);
                await ticketApiGateway.upsert({ticketId, createdAt: now, status: "captured", localUri: fileUri, thumbUri});
                dispatch(photoCaptured({ticketId, createdAt: now, localUri: fileUri, thumbUri}));
                await dispatch(uploadRequested({ticketId}));
            } catch {
                dispatch(uploadFailed({ ticketId, reason: "CAPTURE_OR_SAVE_ERROR" }));
            }
        };

export const uploadRequested =
    (id: { ticketId: string }) : AppThunk<Promise<void>> =>

        async (dispatch, _, { ticketApiGateway, validityGateway }) => {
            const {ticketId} = id;
            const meta = await ticketApiGateway.get(ticketId);
            if(!meta?.localUri){
                dispatch(uploadFailed({ticketId, reason: "MISSING_FILE"}));
                return;
            }
            await ticketApiGateway.patch(ticketId, {status: "uploading"});
            const {remoteId} = await validityGateway.upload(meta.localUri, (pct) =>
                dispatch(uploadProgressed({ticketId, pct}))
            );
            await ticketApiGateway.patch(ticketId, {status: "pending", remoteId});
            dispatch(uploadSucceeded({ticketId, remoteId}));
        }

