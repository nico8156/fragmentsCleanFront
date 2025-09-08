import { ticketMetaReducer } from "@/app/core-logic/reducers/ticketMetaReducer";
import {
    photoCaptured, uploadFailed,
    uploadRequested,
    uploadSucceeded,
    validationReceived
} from "@/app/core-logic/use-cases/ticket/onTicketFlowFactory";


const init = () => ticketMetaReducer(undefined as any, { type: "@@INIT" } as any);

describe("ticket <reducer", () => {
    it("photoCaptured crée la meta avec URIs", () => {
        const s1 = init();
        const s2 = ticketMetaReducer(s1, photoCaptured({
            ticketId: "t1", createdAt: 1, localUri: "file://t1.jpg", thumbUri: "file://t1.thumb.jpg"
        }));
        expect(s2.ids[0]).toBe("t1");
        expect(s2.byId["t1"].status).toBe("captured");
        expect(s2.byId["t1"].localUri).toBe("file://t1.jpg");
    });

    it("uploadRequested -> statut uploading", () => {
        const s1 = ticketMetaReducer(init(), photoCaptured({
            ticketId: "t1", createdAt: 1, localUri: "f", thumbUri: "th"
        }));
        const s2 = ticketMetaReducer(s1, uploadRequested({ ticketId: "t1" }));
        expect(s2.byId["t1"].status).toBe("uploading");
    });

    it("uploadSucceeded -> pending + remoteId", () => {
        const s1 = ticketMetaReducer(init(), photoCaptured({
            ticketId: "t1", createdAt: 1, localUri: "f", thumbUri: "th"
        }));
        const s2 = ticketMetaReducer(s1, uploadSucceeded({ ticketId: "t1", remoteId: "r-1" }));
        expect(s2.byId["t1"].status).toBe("pending");
        expect(s2.byId["t1"].remoteId).toBe("r-1");
    });

    it("validationReceived valid -> validated + increment unique", () => {
        const s1 = ticketMetaReducer(init(), photoCaptured({
            ticketId: "t1", createdAt: 1, localUri: "f", thumbUri: "th"
        }));
        const s2 = ticketMetaReducer(s1, validationReceived({
            ticketId: "t1", valid: true, data: { cafeName: "Le Bon Café", amountCents: 420 }
        }));
        const s3 = ticketMetaReducer(s2, validationReceived({
            ticketId: "t1", valid: true, data: { cafeName: "X" }
        }));
        expect(s2.byId["t1"].status).toBe("validated");
        expect(s2.validCount).toBe(1);
        expect(s3.validCount).toBe(1); // pas de double incrément
    });

    it("uploadFailed -> invalid + reason", () => {
        const s1 = ticketMetaReducer(init(), photoCaptured({
            ticketId: "t1", createdAt: 1, localUri: "f", thumbUri: "th"
        }));
        const s2 = ticketMetaReducer(s1, uploadFailed({ ticketId: "t1", reason: "UPLOAD_ERROR" }));
        expect(s2.byId["t1"].status).toBe("invalid");
        expect(s2.byId["t1"].invalidReason).toBe("UPLOAD_ERROR");
    });
});
