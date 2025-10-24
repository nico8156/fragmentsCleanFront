import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {Like} from "@/app/store/appState";
import {FakeLikeGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikeGateway";
import {retrieveLike} from "@/app/core-logic/use-cases/socials/like/retrieveLike";
import {unlikeCoffee} from "@/app/core-logic/use-cases/socials/like/unlikeCoffee";

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
        await store.dispatch(unlikeCoffee({id: "2", authorId: "u2", coffeeId: "c2"}))
        expect(store.getState().likeRetrieval.data).toEqual(alike.filter(like => like.id !== "2"));
        expect(store.getState().likeRetrieval.data.length).toEqual(2);
    });
    const alike :Like[] = [{id: "1", authorId: "u1", coffeeId: "c1"}, {id: "2", authorId: "u2", coffeeId: "c2"}, {id: "3", authorId: "u3", coffeeId: "c3"}];
})