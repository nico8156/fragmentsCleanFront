import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeLikeGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikeGateway";
import {likeCoffee} from "@/app/core-logic/use-cases/socials/like/likeCoffee";
import {Like} from "@/app/store/appState";
import {retrieveLike} from "@/app/core-logic/use-cases/socials/like/retrieveLike";

describe('On coffee liked', () => {
    let store: ReduxStore;
    let likeGateway: FakeLikeGateway;

    beforeEach(() =>{
        likeGateway = new FakeLikeGateway();
        store = initReduxStore({gateways: {likeGateway}});
    })

    it('should had a coffee to existing likes', async () => {
        likeGateway.nextLike = aLike;
        await store.dispatch(retrieveLike());
        await store.dispatch(likeCoffee("3","u3","c3"))
        expect(store.getState().likeRetrieval.data).toEqual([...aLike, {id: "3", userId: "u3", coffeeId: "c3"}] );
        expect(store.getState().likeRetrieval.data.length).toEqual(3);
    })
    const aLike: Like[] = [{id: "1", userId: "u1", coffeeId: "c1"}, {id: "2", userId: "u2", coffeeId: "c2"}];
})