// test
import { initReduxStore, ReduxStore } from "@/app/store/reduxStore";
import {captureRequested, onTestFactory, uploadSucceeded} from "@/app/core-logic/use-cases/ticket/test";
import {
    FakeCamera,
    FakeRepo,
    FakeStorage, FakeUploader
} from "@/app/adapters/secondary/gateways/fake/fakeTicketGateways/fakeTicketGateways";
import {jest} from "@jest/globals";


describe("On ticket flow, ", () => {

    let store: ReduxStore;
    let cameraGateway: FakeCamera;
    let storageGateway: FakeStorage;
    let ticketApiGateway: FakeRepo;
    let validityGateway: FakeUploader;

    beforeEach(() => {
        jest.useFakeTimers();
        cameraGateway = new FakeCamera();
        storageGateway = new FakeStorage();
        ticketApiGateway = new FakeRepo();
        validityGateway = new FakeUploader();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    const createListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) =>
        onTestFactory(
            cameraGateway,
            storageGateway,
            ticketApiGateway,
            validityGateway
            , () => {
            try {doExpect();resolve({});} catch (e) {reject(e);
            }});

    const createStoreWithListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) =>
        initReduxStore({
            gateways: { cameraGateway, storageGateway, ticketApiGateway, validityGateway },
            listeners: [createListener(doExpect, resolve, reject).middleware],
        });

    it("capture -> upload -> pending, puis validation -> validated", async() => {
        return new Promise((resolve, reject) => {
            store = createStoreWithListener(
                () => {
                    const s = store.getState().ticketState;
                    expect(s.ids.length).toBe(1);
                    const id = s.ids[0];
                    expect(id).toBeDefined();
                    expect(s.byId[id].status).toBe("pending");
                },
                resolve,
                reject,
            );
            //cameraGateway.delayMs = 100;
            store.dispatch(captureRequested());
            jest.advanceTimersByTime(10000);


        })
    });
});
