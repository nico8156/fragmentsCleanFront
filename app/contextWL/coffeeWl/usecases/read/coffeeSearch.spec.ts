import { coffeesSearch } from "./coffeeRetrieval";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";


describe("On Coffees search (batch hydrate)", () => {
    let coffeeGateway: FakeCoffeeGateway;
    let store: ReduxStoreWl

    beforeEach(() => {
        coffeeGateway = new FakeCoffeeGateway();
        store = initReduxStoreWl({ dependencies: {
            gateways: {
                coffees: coffeeGateway,
            }
            } });
    })

    it("should hydrates list filtered by city and query", async () => {

        coffeeGateway.store.set("a", {
            id: "a", name: "Lomi", location: { lat: 48.889, lon: 2.358 },
            address: { city: "Paris", country: "FR" }, tags: ["roaster"], version: 1, updatedAt: "2025-10-10T08:05:00.000Z" as any,
        });
        coffeeGateway.store.set("b", {
            id: "b", name: "Café Joyeux", location: { lat: 48.114, lon: -1.678 },
            address: { city: "Rennes", country: "FR" }, tags: ["espresso"], version: 2, updatedAt: "2025-10-10T08:06:00.000Z" as any,
        });

        await store.dispatch<any>(coffeesSearch({ city: "Rennes", query: "espresso" }));

        const state: any = store.getState();
        expect(Object.keys(state.cfState.byId)).toContain("b");
        expect(Object.keys(state.cfState.byId)).not.toContain("a");
    });
});
