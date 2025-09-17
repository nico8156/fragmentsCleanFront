import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

export const ocrStarted = createAction("OCR_STARTED_ANALYSIS")
export const ocrFailed = createAction("OCR_FAILED_ANALYSIS")
export const dataFromTicketSentToServer = createAction("DATA_FROM_TICKET_SENT_TO_SERVER")
export const ticketDraftCreated = createAction<{id: string, imageUri: string, capturedAt: string}>("TICKET_DRAFT_CREATED")

export const onTicketCaptured =
    (imageUri: string) : AppThunk<Promise<void>> =>
    async (dispatch, getState,{ocrGateway, ticketApiGateway}) => {
        const id = uuidv4();
        const capturedAt = new Date().toISOString();
        // on crée le draft
        dispatch(ticketDraftCreated({ id, imageUri, capturedAt }));
        //dispatch du debut du flow
        dispatch(ocrStarted());
        try{
            const result = await ocrGateway.recognize(imageUri);
        } catch (e){
            dispatch(ocrFailed())
            return
        }
        // on passe par le gateway ocr pour la chaine de caracteres
        // envoie au server de la chaine resultante
        try{
            await ticketApiGateway.verify(result);
            dispatch(dataFromTicketSentToServer());
        }catch (e){

        }


    }