import { jest } from "@jest/globals";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { ticketMetaReducer } from "@/app/core-logic/reducers/ticketMetaReducer";
import {
    FakeCamera,
    FakeRepo,
    FakeStorage, FakeUploader
} from "@/app/adapters/secondary/gateways/fake/fakeTicketGateways/fakeTicketGateways";
import {captureRequested, onTicketFlowFactory} from "@/app/core-logic/use-cases/ticket/onTicketFlowFactory";
import {ReduxStore} from "@/app/store/reduxStore";
import {onGoogleAuthFactory} from "@/app/core-logic/use-cases/auth/onGoogleAuth";


const makeStore = (listener:any) => {
    return configureStore({
        reducer: combineReducers({ ticket: ticketMetaReducer }),
        middleware: (gdm) => gdm().prepend(listener.middleware),
    });
};

describe("ticket flow", () => {
    let store: ReduxStore;
    let camera: FakeCamera;
    let storage: FakeStorage;
    let repo: FakeRepo;
    let uploader: FakeUploader;

    beforeEach(() => {
        jest.useFakeTimers();
        camera = new FakeCamera();
        storage = new FakeStorage();
        repo = new FakeRepo();
        uploader = new FakeUploader();
    });
    afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

    it("capture -> upload -> pending, puis validation -> validated", async () => {

        let store: any;
        await new Promise<void>((resolve, reject) => {
            const listener = onTicketFlowFactory({ camera, storage, repo, uploader, done: resolve });
            store = makeStore(listener);
            store.dispatch(captureRequested());
            jest.runOnlyPendingTimers();
        });

        const s1 = store.getState();
        const tid = s1.ticket.ids[0];
        expect(s1.ticket.byId[tid].status).toBe("pending");
        expect(s1.ticket.byId[tid].remoteId).toBeTruthy();

        // simulate server validation
        const remoteId = s1.ticket.byId[tid].remoteId;
        uploader.emit(remoteId, { valid: true, data: { cafeName: "Le Bon Café", amountCents: 420 } });
        await Promise.resolve();

        const s2 = store.getState();
        expect(s2.ticket.byId[tid].status).toBe("validated");
        expect(s2.ticket.validCount).toBe(1);
    });
    it("upload KO -> invalid", async () => {
        uploader.willFail = true;

        let store:any;
        await new Promise<void>((resolve) => {
            const listener = onTicketFlowFactory({ camera, storage, repo, uploader, done: resolve });
            store = configureStore({
                reducer: combineReducers({ ticket: ticketMetaReducer }),
                middleware: (gdm) => gdm().prepend(listener.middleware),
            });
            store.dispatch(captureRequested());
            jest.runOnlyPendingTimers();
        });

        const s = store.getState();
        const tid = s.ticket.ids[0];
        expect(s.ticket.byId[tid].status).toBe("invalid");
        expect(s.ticket.byId[tid].invalidReason).toBe("UPLOAD_ERROR");
    });

});
