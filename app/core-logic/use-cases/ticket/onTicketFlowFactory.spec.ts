import { jest } from "@jest/globals";
import { initReduxStore, ReduxStore } from "@/app/store/reduxStore";
import {FakeCamera} from "@/app/adapters/secondary/gateways/fake/fakeCameraGateway";
import {FakeStorage} from "@/app/adapters/secondary/gateways/fake/fakeStorageGateway";
import {FakeRepo} from "@/app/adapters/secondary/gateways/fake/fakeTicketMetaGateway";
import {FakeUploader} from "@/app/adapters/secondary/gateways/fake/fakeTicketUploadGateway";
import {captureRequested, onTicketFlowFactory} from "@/app/core-logic/use-cases/ticket/onTicketFlowFactory";
import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";
import {ticketMetaReducer} from "@/app/core-logic/reducers/ticketMetaReducer";

describe("Ticket flow (capture → upload → validation)", () => {
    let store: ReduxStore;
    let camera: CameraGateway;
    let storage: PhotoStorageGateway;
    let repo: RemoteTicketMetaGateway;
    let uploader: TicketUploadGateway;

    beforeEach(() => {
        jest.useFakeTimers();
        camera = new FakeCamera();
        storage = new FakeStorage();
        repo = new FakeRepo();
        uploader = new FakeUploader();
    });
    afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

    const createListener = (doExpect: () => void, resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        onTicketFlowFactory({ camera, storage, repo, uploader }, () => {
            try { doExpect(); resolve({}); } catch (e) { reject(e); }
        });

    const createStoreWithListener = (doExpect: () => void, resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        initReduxStore({
            gateways: { camera, storage, repo, uploader },
            listeners: [createListener(doExpect, resolve, reject).middleware],
            extraReducers: { ticket: ticketMetaReducer }, // <-- important
        });


    it('status "pending" après uploadSucceeded', () => {
        return new Promise((resolve, reject) => {
            store = createStoreWithListener(() => {
                const st: any = store.getState();
                const [tid] = st.ticket.ids;
                const t = st.ticket.byId[tid];
                expect(t.status).toBe("pending");
                expect(t.remoteId).toBeTruthy();
            }, resolve, reject);

            store.dispatch(captureRequested());

            // si tes fakes ont des délais, avance-les:
            jest.runOnlyPendingTimers();
            Promise.resolve().then(() => {});
        });
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
