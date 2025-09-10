import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {
    FakeCameraGateway,
    FakePhotoStorageGateway, FakeRemoteTicketMetaGateway, FakeValidityGateway
} from "@/app/adapters/secondary/gateways/fake/fakeTicketGateways";
import {captureRequested, performUpload} from "@/app/core-logic/use-cases/ticket/onTicketSubmitedFlow";


describe('On Ticket flow, ', () => {
    let store: ReduxStore;
    let cameraGateway: FakeCameraGateway;
    let storageGateway: FakePhotoStorageGateway;
    let ticketApiGateway: FakeRemoteTicketMetaGateway;
    let validityGateway: FakeValidityGateway;

    beforeEach(() => {
        cameraGateway = new FakeCameraGateway();
        storageGateway = new FakePhotoStorageGateway();
        ticketApiGateway = new FakeRemoteTicketMetaGateway();
        validityGateway = new FakeValidityGateway();
        store = initReduxStore({gateways: {cameraGateway, storageGateway, ticketApiGateway, validityGateway}});
        cameraGateway.willFail = false;
        storageGateway.willFail = false;
        ticketApiGateway.willFailOnUpsert = false;
        ticketApiGateway.willFailOnPatchUploading = false;
        ticketApiGateway.willFailOnPatchPending = false;
        validityGateway.willFailUpload = false;
        validityGateway.progressSteps = [0, 100];
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
    it('should update status and reason if camera failed', async() => {
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
        // Arrange: pas de photoCaptured / pas d’upsert → le fake renverra undefined
        const ticketId = "t-missing-file";

        // Act
        await store.dispatch<any>(performUpload({ ticketId }));

        // Assert
        const s = store.getState().ticketState;
        expect(s.ids).toContain(ticketId);                // l’entrée a été créée par uploadFailed
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
    it('fail si validityGateway.upload throw → UPLOAD_ERROR (upload try/catch séparé)', async () => {
        // Arrange: capture OK
        cameraGateway.willFail = false;
        storageGateway.willFail = false;

        // Forcer l'échec upload via le fake
        validityGateway.willFailUpload = true;

        // Act
        await store.dispatch<any>(captureRequested());

        // Assert
        const s = store.getState().ticketState;
        expect(s.ids.length).toBe(1);
        const id = s.ids[0];
        expect(s.byId[id].status).toBe("invalid");
        expect(s.byId[id].invalidReason).toBe("UPLOAD_ERROR"); // ← attendu si upload catché côté uploadRequested
    });

    it('4a) échec patch vers "uploading" ⇒ status invalid / reason UPLOAD_ERROR', async () => {
        ticketApiGateway.willFailOnPatchUploading = true;

        await store.dispatch<any>(captureRequested());

        const s = store.getState().ticketState;
        expect(s.ids.length).toBe(1);
        const id = s.ids[0];
        expect(s.byId[id].status).toBe("invalid");
        expect(s.byId[id].invalidReason).toBe("UPLOAD_ERROR");
    });
    it('4b) échec patch vers "pending" ⇒ status invalid / reason UPLOAD_ERROR', async () => {
        // on laisse "uploading" passer
        ticketApiGateway.willFailOnPatchUploading = false;
        // on casse lors du patch "pending"
        ticketApiGateway.willFailOnPatchPending = true;

        await store.dispatch<any>(captureRequested());

        const s = store.getState().ticketState;
        expect(s.ids.length).toBe(1);
        const id = s.ids[0];
        expect(s.byId[id].status).toBe("invalid");
        expect(s.byId[id].invalidReason).toBe("UPLOAD_ERROR");
    });
    it('fail si ticketApiGateway.upsert échoue → CAPTURE_OR_SAVE_ERROR', async () => {
        cameraGateway.willFail = false;
        storageGateway.willFail = false;
        ticketApiGateway.willFailOnUpsert = true;

        await store.dispatch<any>(captureRequested());

        const s = store.getState().ticketState;
        expect(s.ids.length).toBe(1);
        const id = s.ids[0];
        expect(s.byId[id].status).toBe("invalid");
        expect(s.byId[id].invalidReason).toBe("CAPTURE_OR_SAVE_ERROR");
    });
    it('fail si ticketApiGateway.get throw → UPLOAD_ERROR', async () => {
        const ticketId = "t-get-fail";
        ticketApiGateway.willFailOnGet = true;

        await store.dispatch<any>(performUpload({ ticketId }));

        const s = store.getState().ticketState;
        expect(s.ids).toContain(ticketId);
        expect(s.byId[ticketId].status).toBe("invalid");
        expect(s.byId[ticketId].invalidReason).toBe("UPLOAD_ERROR");
    });
    it('enregistre la progression 0→100 pendant l’upload', async () => {
        cameraGateway.willFail = false;
        storageGateway.willFail = false;
        validityGateway.willFailUpload = false;
        validityGateway.progressSteps = [0, 30, 60, 100];

        await store.dispatch<any>(captureRequested());

        const s = store.getState().ticketState;
        const id = s.ids[0];
        expect(s.uploadProgress[id]).toBe(100); // dernier pct reçu
        expect(s.byId[id].status).toBe("pending"); // upload ok
    });
})