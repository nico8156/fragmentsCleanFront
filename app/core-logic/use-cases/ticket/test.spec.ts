// test
import { initReduxStore, ReduxStore } from "@/app/store/reduxStore";
import {jest} from "@jest/globals";
import {captureRequested, onTestFactory} from "@/app/core-logic/use-cases/ticket/test";
import {
     FakeCameraGateway,
    FakePhotoStorageGateway,
    FakeRemoteTicketMetaGateway,
    FakeTicketUploadGateway
} from "@/app/adapters/secondary/gateways/fake/fakeTicketGateways/fakeTicketGateways";

describe("On ticket flow, ", () => {

    let store: ReduxStore;
    let cameraGateway: FakeCameraGateway;
    let storageGateway: FakePhotoStorageGateway;
    let ticketApiGateway: FakeRemoteTicketMetaGateway;
    let validityGateway: FakeTicketUploadGateway;

    beforeEach(() => {
        jest.useFakeTimers();
        cameraGateway = new FakeCameraGateway();
        storageGateway = new FakePhotoStorageGateway();
        ticketApiGateway = new FakeRemoteTicketMetaGateway();
        validityGateway = new FakeTicketUploadGateway();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    const createListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) => {
        return onTestFactory(
            cameraGateway,
            storageGateway,
            ticketApiGateway,
            validityGateway
            , () => {
                try {
                    doExpect();
                    resolve({});
                } catch (e) {
                    reject(e);
                }
            }).middleware
    };

    const createStoreWithListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) => {
        return initReduxStore({
            gateways: {cameraGateway, storageGateway, ticketApiGateway, validityGateway},
            listeners: [createListener(doExpect, resolve, reject)],
        });
    }

    it("should have a status of pending before validation received", async() => {

        cameraGateway.willFail = false;
        storageGateway.willFail = false;
        validityGateway.willFail = false;
        validityGateway.progressSteps = [5, 60, 100];
        validityGateway.totalDelayMs = 300;

        return new Promise((resolve, reject) => {
            store = createStoreWithListener(
                () => {
                    flush(600);
                    const s = store.getState().ticketState;
                    expect(s.ids.length).toBe(1);
                    const id = s.ids[0];
                    expect(id).toBeDefined();
                    expect(s.byId[id].status).toBe("pending");
                },
                resolve,
                reject,
            );
            store.dispatch(captureRequested());
            jest.advanceTimersByTime(2000);
            flush(600);


        })
    });
    it("wires are connected", async () => {
        const cb = jest.fn();

        const mw = onTestFactory(
            cameraGateway,
            storageGateway,
            ticketApiGateway,
            validityGateway,
            cb
        ).middleware;

        const store = initReduxStore({
            gateways: { cameraGateway, storageGateway, ticketApiGateway, validityGateway },
            listeners: [mw],
        });

        cameraGateway.willFail = true; // force le catch du premier listener
        store.dispatch(captureRequested());
        await Promise.resolve();
        await jest.runOnlyPendingTimersAsync();
        await Promise.resolve();

        // Pas besoin d'avancer les timers: le catch appelle callback immédiatement.
        expect(cb).toHaveBeenCalled(); // <- si ça fail -> mauvais fichier importé OU listener non monté
    });
    it("listener branché + callback appelé en cas d'erreur caméra", async () => {
        jest.useFakeTimers();

        const cb = jest.fn();

        // Monte le middleware de TA factory patchée
        const mw = onTestFactory(
            cameraGateway,
            storageGateway,
            ticketApiGateway,
            validityGateway,
            cb
        ).middleware;

        const store = initReduxStore({
            gateways: { cameraGateway, storageGateway, ticketApiGateway, validityGateway },
            listeners: [mw], // <= assure-toi que initReduxStore les PREND en compte (cf. §3)
        });

        // 1) Force l'échec caméra de façon immédiate (pas besoin de timers)
        cameraGateway.capture = jest.fn().mockRejectedValue(new Error("CAMERA_ERROR"));

        // 2) Dispatch
        store.dispatch(captureRequested());

        // 3) Flush micro-tâches + timers (au cas où)
        await Promise.resolve();
        await jest.runOnlyPendingTimersAsync();
        await Promise.resolve();

        // 4) Asserts
        expect(cameraGateway.capture).toHaveBeenCalled();
        expect(cb).toHaveBeenCalled(); // <-- si encore 0: middleware pas monté OU mauvaise factory importée
    });
});
const flush = async (ms?: number) => {
    if (typeof ms === "number") jest.advanceTimersByTime(ms);
    await Promise.resolve();                // microtasks
    await jest.runOnlyPendingTimersAsync(); // timers en attente
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();         // microtasks post-timers
};

