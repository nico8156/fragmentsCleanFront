import { createSlice } from "@reduxjs/toolkit";
import {TicketMeta} from "@/app/store/appState";
import {
    photoCaptured, uploadFailed,
    uploadProgressed,
    uploadRequested, uploadSucceeded,
    validationReceived
} from "@/app/core-logic/use-cases/ticket/onTicketFlowFactory";

type ById<T> = Record<string, T>;

type TicketState = {
    byId: ById<TicketMeta>;
    ids: string[];
    uploadProgress: Record<string, number>;
    validCount: number;
    validatedIds: Record<string, true>;
};

const initialState: TicketState = {
    byId: {},
    ids: [],
    uploadProgress: {},
    validCount: 0,
    validatedIds: {},
};

const slice = createSlice({
    name: "ticket",
    initialState,
    reducers: {},
    extraReducers: (b) => {
        b.addCase(photoCaptured, (s, a) => {
            const { ticketId, createdAt, localUri, thumbUri } = a.payload;
            if (!s.byId[ticketId]) s.ids.unshift(ticketId);
            s.byId[ticketId] = { ticketId, status: "captured", createdAt, localUri, thumbUri };
        });
        b.addCase(uploadRequested, (s, a) => {
            const t = s.byId[a.payload.ticketId]; if (t) t.status = "uploading";
        });
        b.addCase(uploadProgressed, (s, a) => {
            s.uploadProgress[a.payload.ticketId] = a.payload.pct;
        });
        b.addCase(uploadSucceeded, (s, a) => {
            const t = s.byId[a.payload.ticketId]; if (t) { t.status = "pending"; t.remoteId = a.payload.remoteId; }
        });
        b.addCase(uploadFailed, (s, a) => {
            const t = s.byId[a.payload.ticketId]; if (t) { t.status = "invalid"; t.invalidReason = a.payload.reason ?? "UPLOAD_ERROR"; }
        });
        b.addCase(validationReceived, (s, a) => {
            const { ticketId, valid, data, reason } = a.payload;
            const t = s.byId[ticketId]; if (!t) return;
            if (valid) {
                t.status = "validated"; t.validatedAt = Date.now(); Object.assign(t, data);
                if (!s.validatedIds[ticketId]) { s.validatedIds[ticketId] = true; s.validCount += 1; }
            } else {
                t.status = "invalid"; t.invalidReason = reason ?? "UNREADABLE";
            }
        });
    },
});

export const ticketMetaReducer = slice.reducer;
