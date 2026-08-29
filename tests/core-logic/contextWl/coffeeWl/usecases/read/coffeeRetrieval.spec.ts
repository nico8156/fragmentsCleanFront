import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {
    coffeeGlobalRetrieval,
    coffeeRetrieval
} from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import {AppStateWl} from "@/app/store/appStateWl";

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
        coffeeGateway.nextItems = [
            { id: "coffee-1", googleId: "place-1", name: "Projection Café", location: { lat: 48.11, lon: -1.67 }, address: { city: "Rennes", country: "FR" }, phoneNumber: "0102030405", tags: [], version: 1, updatedAt: "2026-08-29T10:00:00Z" as any },
            { id: "coffee-2", name: "Second Café", location: { lat: 48.12, lon: -1.68 }, address: { city: "Rennes", country: "FR" }, tags: [], version: 1, updatedAt: "2026-08-29T10:00:00Z" as any },
        ];
        await store.dispatch<any>(coffeeGlobalRetrieval())
        const c = (store.getState() as any).cfState
        expect(c.byId["coffee-1"].name).toEqual("Projection Café")
        expect(c.byId["coffee-2"].name).toEqual("Second Café")
        expect(c.byCity["rennes"].length).toEqual(2)
        expect(c.ids.length).toEqual(2)
    })

    it("replaces the catalogue snapshot and removes coffees absent from the public projection", async () => {
        const coffee = { id: "coffee-archived", name: "Archived later", location: { lat: 48.11, lon: -1.67 }, address: { city: "Rennes" }, tags: [], version: 1, updatedAt: "2026-08-29T10:00:00Z" as any };
        coffeeGateway.nextItems = [coffee];
        await store.dispatch<any>(coffeeGlobalRetrieval());
        expect((store.getState() as any).cfState.byId["coffee-archived"]).toBeDefined();

        coffeeGateway.nextItems = [];
        await store.dispatch<any>(coffeeGlobalRetrieval());

        const catalogue = (store.getState() as any).cfState;
        expect(catalogue.byId["coffee-archived"]).toBeUndefined();
        expect(catalogue.ids).toEqual([]);
        expect(catalogue.byCity).toEqual({});
    });
});
