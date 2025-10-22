import { coffeeRetrieval } from "./coffeeRetrieval";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";


describe("On Coffee retrieval (single) : ", () => {
    let store: ReduxStoreWl;
    let coffeeGateway: FakeCoffeeGateway;

    beforeEach(() => {
        coffeeGateway = new FakeCoffeeGateway();
        store = initReduxStoreWl({ dependencies: {
            gateways: {
                coffees: coffeeGateway,
            }
            } });
    })
    it("should hydrates a coffeeGateway from gateway", async () => {
        coffeeGateway.store.set("cafe_A", {
            id: "cafe_A",
            name: "Café La Plume",
            location: { lat: 48.117, lon: -1.678 },
            address: { city: "Rennes", country: "FR" },
            tags: ["espresso", "filter"],
            rating: 4.7,
            version: 3,
            updatedAt: "2025-10-10T08:00:00.000Z" as any,
        });

        await store.dispatch<any>(coffeeRetrieval({ id: "cafe_A" }));

        const c = store.getState().cfState.byId["cafe_A"];
        expect(c?.name).toBe("Café La Plume");
        expect(c?.version).toBe(3);
        expect(c?.address?.city).toBe("Rennes");
    });

    it("should sets error when gateway fails", async () => {
        coffeeGateway.willFailGet = true;

        await store.dispatch<any>(coffeeRetrieval({ id: "missing" as any }));
        const c = (store.getState() as any).cfState.byId["missing"];
        expect(c?.loading).toBe("error");
        expect(c?.error).toBe("coffee get failed");
    });
});
