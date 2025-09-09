import {AppThunk} from "@/app/store/reduxStore";
import {photoCaptured, uploadRequested} from "@/app/core-logic/use-cases/ticket/test";


export const captureRequested =
    (): AppThunk<Promise<void>> =>
        async (dispatch, _, { cameraGateway, storageGateway, ticketApiGateway }) => {
            const ticketId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const now = Date.now();
            const { localUri } = await cameraGateway.capture();
            const { fileUri, thumbUri } = await storageGateway.savePhoto(localUri, ticketId);
            await ticketApiGateway.upsert({ ticketId, createdAt: now, status: "captured", localUri: fileUri, thumbUri });
            dispatch(photoCaptured({ ticketId, createdAt: now, localUri: fileUri, thumbUri }));
            dispatch(uploadRequested({ticketId}));
        };
