import { jest } from "@jest/globals";
import { initReduxStore, ReduxStore } from "@/app/store/reduxStore";
import { ticketMetaReducer } from "@/app/core-logic/reducers/ticketMetaReducer";
import { combineReducers } from "@reduxjs/toolkit";
import {FakeCamera} from "@/app/adapters/secondary/gateways/fake/fakeCameraGateway";
import {FakeStorage} from "@/app/adapters/secondary/gateways/fake/fakeStorageGateway";
import {FakeRepo} from "@/app/adapters/secondary/gateways/fake/fakeTicketMetaGateway";
import {FakeUploader} from "@/app/adapters/secondary/gateways/fake/fakeTicketUploadGateway";
import {captureRequested, onTicketFlowFactory} from "@/app/core-logic/use-cases/ticket/onTicketFlowFactory";
import {onGoogleAuthFactory} from "@/app/core-logic/use-cases/auth/onGoogleAuth";

describe("Ticket flow (capture → upload → validation)", () => {
    let store: ReduxStore;
    let camera: FakeCamera;
    let storage: FakeStorage;
    let repo: FakeRepo;
    let uploader: FakeUploader;

    beforeEach(() => {
        jest.useFakeTimers();
        const camera = new FakeCamera();
        const storage = new FakeStorage();
        const repo = new FakeRepo();
        const uploader = new FakeUploader();
    });
    afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

    const createListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) =>
        onTicketFlowFactory( {camera: camera; storage: storage},() => {
            try {
                doExpect();
                resolve({});
            } catch (e) {
                reject(e);
            }
        });

    const createStoreWithListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) =>
        initReduxStore({
            gateways: {  },
            listeners: [createListener(doExpect, resolve, reject).middleware],
        });


    it("happy path", async () => {
        await new Promise<void>((resolve, reject) => {
            store = makeStore(() => {
                try {
                    const state:any = store.getState() as any;
                    const [tid] = state.ticket.ids;
                    const t = state.ticket.byId[tid];
                    expect(t.status).toBe("pending"); // au moment où on sort du listener upload
                    resolve();
                } catch (e) { reject(e); }
            });

            store.dispatch(captureRequested());

            // laisse tourner les éventuels timers des fakes
            jest.runOnlyPendingTimers(); // synchro rapide
        });

        // Émettre la validation (côté serveur simulé)
        const state1:any = store.getState();
        const tid = state1.ticket.ids[0];
        const remoteId = state1.ticket.byId[tid].remoteId;

        uploader.emit(remoteId, { valid: true, data: { cafeName: "Le Bon Café", amountCents: 420 } });

        // laisser la micro-tâche se résoudre
        await Promise.resolve();

        const state2:any = store.getState();
        const t2 = state2.ticket.byId[tid];
        expect(t2.status).toBe("validated");
        expect(t2.cafeName).toBe("Le Bon Café");
        expect(state2.ticket.validCount).toBe(1);
    });

    it("upload KO → invalid", async () => {
        uploader.willFail = true;

        await new Promise<void>((resolve, reject) => {
            store = makeStore(() => {
                try {
                    const st:any = store.getState();
                    const tid = st.ticket.ids[0];
                    expect(st.ticket.byId[tid].status).toBe("invalid");
                    resolve();
                } catch (e) { reject(e); }
            });
            store.dispatch(captureRequested());
            jest.runOnlyPendingTimers();
        });
    });
});
