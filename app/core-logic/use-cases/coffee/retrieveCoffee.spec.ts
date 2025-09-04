import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {AppState, Coffee} from "@/app/store/appState";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fakeCoffeeGateway";
import {retrieveCoffee} from "@/app/core-logic/use-cases/coffee/retrieveCoffee";

describe('coffee retrieval', () => {
    let store: ReduxStore;
    let coffeeGateway: FakeCoffeeGateway;

    beforeEach(() => {
        coffeeGateway = new FakeCoffeeGateway();
        store = initReduxStore({gateways: {coffeeGateway}});
    });
    it("before retrieving coffee, no coffee should be available", () => {
        expect(store.getState().coffeeRetrieval).toEqual<
            AppState["coffeeRetrieval"]
        >({data: []});
    });

    it("should retrieve all coffee", async () => {
        coffeeGateway.nextCoffees = aCoffees;
        await store.dispatch(retrieveCoffee());
        expect(store.getState().coffeeRetrieval).toEqual<
            AppState["coffeeRetrieval"]
        >({data: aCoffees});
    });

    const aCoffees: Coffee[] = [
        { id: "1", name: "Meilleur Café" },
        { id: "2", name: "Brûlerie Test" },
    ];
})