import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {onCfPhotoRetrieval} from "@/app/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import {FakeCfPhotoWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import {AppStateWl} from "@/app/store/appStateWl";


describe('On coffee photo retrieval asked', () => {

    let store:ReduxStoreWl
    let photoGateway:FakeCfPhotoWlGateway

    beforeEach(()=> {
        photoGateway = new FakeCfPhotoWlGateway()
        store = initReduxStoreWl({dependencies:{
            gateways:{
                cfPhotos : photoGateway
            }
        }})
    })
    it('should retrieve data and normalize photos', async () => {
        await store.dispatch<any>(onCfPhotoRetrieval())
        const state = store.getState() as any
        expect((state.pState as AppStateWl["cfPhotos"]).byCoffeeId["15626614-f66d-4a41-b119-e27c9f963ab1"]).toHaveLength(10)
        expect((state.pState as AppStateWl["cfPhotos"]).byCoffeeId["15626614-f66d-4a41-b119-e27c9f963ab1"]).toContain("https://lh3.googleusercontent.com/places/ANXAkqFWrx4Pj2xFPp8t2s0jMasJxx3DUDGMnQkbdZJSWLpPCzfmhjcorlw3x0MGwrErMe7mDKdQxbxNvROCQnaXGqt4idIVUH6ikRc=s4800-w400-h400")
    })
});