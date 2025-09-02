import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeLikeGateway} from "@/app/adapters/secondary/gateways/fakeLikeGateway";
import {Like} from "@/app/store/appState";
import {retrieveLike} from "@/app/core-logic/use-cases/like/retrieveLike";

describe('On like retrieval', () => {
    let store: ReduxStore;
    let likeGateway: FakeLikeGateway;

    beforeEach(() => {
            likeGateway = new FakeLikeGateway();
            store = initReduxStore({gateways: {likeGateway}});
    })

    it('should retrieve like', async () => {
        likeGateway.nextLike = alike;
        await store.dispatch(retrieveLike());
        expect(store.getState().likeRetrieval.data).toEqual(alike);
        expect(store.getState().likeRetrieval.data.length).toEqual(2);
    })

    const alike: Like[] = [{id: "1", userId: "u1", coffeeId: "c1"}, {id: "2", userId: "u2", coffeeId: "c2"}];
})