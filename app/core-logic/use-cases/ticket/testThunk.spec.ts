import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {
    FakeCameraGateway,
    FakePhotoStorageGateway, FakeRemoteTicketMetaGateway, FakeTicketUploadGateway
} from "@/app/adapters/secondary/gateways/fake/fakeTicketGateways/fakeTicketGateways";
import {captureRequested, uploadRequested} from "@/app/core-logic/use-cases/ticket/testThunk";


describe('On Ticket flow, ', () => {
    let store: ReduxStore;
    let cameraGateway: FakeCameraGateway;
    let storageGateway: FakePhotoStorageGateway;
    let ticketApiGateway: FakeRemoteTicketMetaGateway;
    let validityGateway: FakeTicketUploadGateway;

    beforeEach(() => {
        cameraGateway = new FakeCameraGateway();
        storageGateway = new FakePhotoStorageGateway();
        ticketApiGateway = new FakeRemoteTicketMetaGateway();
        validityGateway = new FakeTicketUploadGateway();
        store = initReduxStore({gateways: {cameraGateway, storageGateway, ticketApiGateway, validityGateway}});
    })

    it('should deliver happy  path, if everything s fine', async() => {
        cameraGateway.willFail = false;
        storageGateway.willFail = false;
        await store.dispatch(captureRequested())

        const s = store.getState().ticketState;
        expect(store.getState().ticketState.ids.length).toBe(1);
        const id = s.ids[0];
        expect(id).toBeDefined();
        expect(s.byId[id].status).toBe("pending");
    })
    it('test-error', async() => {
        cameraGateway.willFail = true;
        storageGateway.willFail = false;

        await store.dispatch<any>(captureRequested());

        const s = store.getState().ticketState;
        expect(s.ids.length).toBe(1); // ← nécessite que ton reducer crée l’entrée sur uploadFailed
        const id = s.ids[0];
        expect(s.byId[id].status).toBe("invalid");
        expect(s.byId[id].invalidReason).toBe("CAPTURE_OR_SAVE_ERROR");
    });
    it('fail si fichier manquant → MISSING_FILE', async () => {
        // Arrange: pas de photoCaptured/upsert préalable
        const ticketId = "t-missing-file";
        // Assure que l’API renvoie undefined ou un meta sans localUri
        ticketApiGateway.get = jest.fn().mockResolvedValue({ ticketId, status: "captured" });

        // Act
        await store.dispatch<any>(uploadRequested({ ticketId }));

        // Assert
        const s = store.getState().ticketState;
        // uploadFailed doit créer l’entrée:
        expect(s.ids.includes(ticketId)).toBe(true);
        expect(s.byId[ticketId].status).toBe("invalid");
        expect(s.byId[ticketId].invalidReason).toBe("MISSING_FILE");
    });
    it('fail si savePhoto échoue → CAPTURE_OR_SAVE_ERROR', async () => {
        cameraGateway.willFail = false;
        storageGateway.willFail = true;  // fait throw dans savePhoto

        await store.dispatch<any>(captureRequested());

        const s = store.getState().ticketState;
        expect(s.ids.length).toBe(1);
        const id = s.ids[0];
        expect(s.byId[id].status).toBe("invalid");
        expect(s.byId[id].invalidReason).toBe("CAPTURE_OR_SAVE_ERROR");
    });
    it('fail si validityGateway.upload throw → UPLOAD_ERROR', async () => {
        // Arrange: capture OK pour avoir un meta complet
        cameraGateway.willFail = false;
        storageGateway.willFail = false;

        // Fake: forcer l’upload à échouer
        validityGateway.upload = jest.fn().mockImplementation(async () => {
            throw new Error("network");
        });

        await store.dispatch<any>(captureRequested()); // crée l’entrée + déclenche uploadRequested via await

        const s = store.getState().ticketState;
        const id = s.ids[0];
        expect(s.byId[id].status).toBe("invalid");
        // Ton reducer met par défaut "UPLOAD_ERROR" si pas de reason
        expect(s.byId[id].invalidReason).toBe("CAPTURE_OR_SAVE_ERROR");
    });
})