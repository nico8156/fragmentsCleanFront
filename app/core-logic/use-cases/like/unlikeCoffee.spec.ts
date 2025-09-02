import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {Like} from "@/app/store/appState";
import {FakeLikeGateway} from "@/app/adapters/secondary/gateways/fakeLikeGateway";
import {retrieveLike} from "@/app/core-logic/use-cases/like/retrieveLike";
import {unlikeCoffee} from "@/app/core-logic/use-cases/like/unlikeCoffee";

describe('On unlike coffee', () => {
    let store: ReduxStore;
    let likeGateway: FakeLikeGateway;

    beforeEach(() => {
        likeGateway = new FakeLikeGateway();
        store = initReduxStore({gateways: {likeGateway}});
    })
    it('should unlike coffee', async () => {
        likeGateway.nextLike = alike;
        await store.dispatch(retrieveLike());
        await store.dispatch(unlikeCoffee({id: "2", userId: "u2", coffeeId: "c2"}))
        //expect(store.getState().likeRetrieval.data).toEqual(alike.filter(like => like.id !== "2"));
        expect(store.getState().likeRetrieval.data.length).toEqual(2);
    });
    const alike :Like[] = [{id: "1", userId: "u1", coffeeId: "c1"}, {id: "2", userId: "u2", coffeeId: "c2"}, {id: "3", userId: "u3", coffeeId: "c3"}];
})