import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {onCfPhotoRetrieval} from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import {FakeCfPhotoWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import {AppStateWl} from "@/app/store/appStateWl";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";


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
    afterEach(()=> {
        photoGateway.willFail = false
    })

    it('should retrieve data and normalize photos', async () => {
        await store.dispatch<any>(onCfPhotoRetrieval())
        const state = store.getState() as any
        expect((state.pState as AppStateWl["cfPhotos"]).byCoffeeId["15626614-f66d-4a41-b119-e27c9f963ab1"]).toHaveLength(10)
        expect((state.pState as AppStateWl["cfPhotos"]).byCoffeeId["15626614-f66d-4a41-b119-e27c9f963ab1"]).toContain("https://lh3.googleusercontent.com/places/ANXAkqFWrx4Pj2xFPp8t2s0jMasJxx3DUDGMnQkbdZJSWLpPCzfmhjcorlw3x0MGwrErMe7mDKdQxbxNvROCQnaXGqt4idIVUH6ikRc=s4800-w400-h400")
    })
    it('should keep current photos when retrieval fails', async () => {
        store.dispatch(photosHydrated({
            photos: [{
                id: "photo_1",
                coffee_id: "coffee_1",
                photo_uri: "https://cdn.example/existing-photo.jpg",
            }],
        }))
        photoGateway.willFail = true
        await store.dispatch<any>(onCfPhotoRetrieval())
        const state = store.getState() as any
        expect((state.pState as AppStateWl["cfPhotos"]).byCoffeeId["coffee_1"]).toEqual([
            "https://cdn.example/existing-photo.jpg",
        ])
    })
});
