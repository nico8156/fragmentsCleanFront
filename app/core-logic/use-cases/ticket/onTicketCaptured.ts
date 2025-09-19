import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

export const ocrStarted = createAction<{id:string}>("OCR_STARTED_ANALYSIS")
export const ocrFailed = createAction<{id: string, reason: string}>("OCR_FAILED_ANALYSIS")
export const ticketDraftCreated = createAction<{id: string, imageUri: string, capturedAt: string}>("TICKET_DRAFT_CREATED")
export const verifyStartSent = createAction<{id: string, jobId: string}>("VERIFY_START_SENT")
export const verifyStartFailed = createAction<{id: string, reason: string}>("VERIFY_START_FAILED")
export const ticketDraftUpdatedWithRawText = createAction<{id: string, rawText: string}>("TICKET_DRAFT_UPDATED_WITH_RAW_TEXT")

const normalizeLines = (lines: string[]) =>
    lines
        .map(l => l.replace(/\s+/g, " ").trim())
        .filter(l => l.length > 0)

export const onTicketCaptured =
    ({imageUri}:{imageUri: string}) : AppThunk<Promise<void>> =>
    async (dispatch, _getState,{ocrGateway, ticketGateway}) => {

        let result: string[] | null = null
        let rawText: string | null= null

        const id = uuidv4()
        const capturedAt = new Date().toISOString()

        dispatch(ticketDraftCreated({ id, imageUri, capturedAt }))
        dispatch(ocrStarted({id}))

        try{
            result = await ocrGateway.recognize(imageUri);
            if (!Array.isArray(result) || result.length === 0) {
                dispatch(ocrFailed({ id, reason: reasonErrorTicketCaptured.EMPTY_OCR }));
                return
            }

            rawText = normalizeLines(result).join("\n")

            if (!rawText.trim()) {
                dispatch(ocrFailed({ id, reason: reasonErrorTicketCaptured.EMPTY_OCR }));
                return
            }
        } catch (e: unknown){
            dispatch(ocrFailed({ id, reason: reasonErrorTicketCaptured.OCR_ERROR }))
            return
        }

        dispatch(ticketDraftUpdatedWithRawText({ id,rawText }));

        try {
            const {jobId} = await ticketGateway.verify({ clientId: id});
            dispatch(verifyStartSent({ id, jobId }));
        } catch (e: unknown) {
            dispatch(verifyStartFailed({ id, reason:reasonErrorTicketCaptured.VERIFY_START_ERROR }));
            return
        }
    }

    export enum reasonErrorTicketCaptured {
        EMPTY_OCR = "EMPTY_OCR",
        OCR_ERROR = "OCR_ERROR",
        VERIFY_START_ERROR = "VERIFY_START_ERROR"
    }