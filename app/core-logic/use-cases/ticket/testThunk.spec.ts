import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {
    FakeCameraGateway,
    FakePhotoStorageGateway, FakeRemoteTicketMetaGateway
} from "@/app/adapters/secondary/gateways/fake/fakeTicketGateways/fakeTicketGateways";
import {captureRequested} from "@/app/core-logic/use-cases/ticket/testThunk";

describe('test', () => {
    let store: ReduxStore;
    let cameraGateway: FakeCameraGateway;
    let storageGateway: FakePhotoStorageGateway;
    let ticketApiGateway: FakeRemoteTicketMetaGateway;

    beforeEach(() => {
        cameraGateway = new FakeCameraGateway();
        storageGateway = new FakePhotoStorageGateway();
        ticketApiGateway = new FakeRemoteTicketMetaGateway();
        store = initReduxStore({gateways: {cameraGateway, storageGateway, ticketApiGateway}});
    })

    it('test', async() => {
        cameraGateway.willFail = false;
        storageGateway.willFail = false;
        // validityGateway.willFail = false;
        // validityGateway.progressSteps = [5, 60, 100];
        // validityGateway.totalDelayMs = 300;
        await store.dispatch(captureRequested())
        const s = store.getState().ticketState;
        expect(store.getState().ticketState.ids.length).toBe(1);
        const id = s.ids[0];
        expect(id).toBeDefined();
        expect(s.byId[id].status).toBe("pending");
    })
})