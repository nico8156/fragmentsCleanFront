import {coffeeGlobalRetrieval, coffeeRetrieval} from "./coffeeRetrieval";
import {FakeCoffeeGateway} from "../../../../adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {initReduxStoreWl, ReduxStoreWl} from "../../../../store/reduxStoreWl";
import {AppStateWl} from "../../../../store/appStateWl";


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
            googleId:"hcsqlkvjqo",
            name: "Café La Plume",
            location: { lat: 48.117, lon: -1.678 },
            address: { city: "Rennes", country: "FR" },
            phoneNumber: "0102030405",
            tags: ["espresso", "filter"],
            rating: 4.7,
            version: 3,
            updatedAt: "2025-10-10T08:00:00.000Z" as any,
        });

        await store.dispatch<any>(coffeeRetrieval({ id: "cafe_A" }));

        const c = (store.getState().cfState as AppStateWl["coffees"]).byId["cafe_A"];
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

    it("should hydrates coffees (global) from gateway", async () => {
        await store.dispatch<any>(coffeeGlobalRetrieval())
        const c = (store.getState() as any).cfState
        expect(c.byId["07dae867-1273-4d0f-b1dd-f206b290626b"]).toBeDefined()
        expect(c.byId["07dae867-1273-4d0f-b1dd-f206b290626b"].name).toEqual("Columbus Café & Co")
        expect(c.byId["4302ac89-13ad-415b-9edf-d9c52957ac33"]).toBeDefined()
        expect(c.byId["4302ac89-13ad-415b-9edf-d9c52957ac33"].name).toEqual("GANG Café de quartier")
        expect(c.byId["4302ac89-15ad-415b-9edf-d9c52957ac33"]).toBeUndefined()
        expect(c.byCity["rennes"].length).toEqual(16)
    })
});
