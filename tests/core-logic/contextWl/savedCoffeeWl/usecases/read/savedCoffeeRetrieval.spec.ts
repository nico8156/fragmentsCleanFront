import { coffeesHydrated } from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";
import type {
	SavedCoffeeGateway,
	SavedCoffeeSnapshot,
} from "@/app/core-logic/contextWL/savedCoffeeWl/gateway/savedCoffee.gateway";
import { savedCoffeesRetrieval } from "@/app/core-logic/contextWL/savedCoffeeWl/usecases/read/savedCoffeeRetrieval";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";

class FakeSavedCoffeeGateway implements SavedCoffeeGateway {
	constructor(private readonly snapshot: SavedCoffeeSnapshot) {}

	getCalls = 0;

	async get(): Promise<SavedCoffeeSnapshot> {
		this.getCalls += 1;
		return this.snapshot;
	}

	async set(): Promise<void> {
		return undefined;
	}
}

describe("savedCoffeesRetrieval", () => {
	it("enriches generic saved coffee snapshots from the local coffee catalog", async () => {
		const savedCoffees = new FakeSavedCoffeeGateway({
			items: [{
				coffeeId: "coffee-1",
				name: "Café",
				savedAt: "2026-07-16T09:00:00.000Z",
				version: 2,
			}],
			version: 2,
		});
		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					savedCoffees,
				},
			},
		});

		store.dispatch(coffeesHydrated([{
			id: "coffee-1",
			googleId: "google-1",
			name: "Café Belleville",
			location: { lat: 48.117, lon: -1.678 },
			address: {
				line1: "12 rue des Fleurs",
				city: "Rennes",
				postalCode: "35000",
				country: "FR",
			},
			phoneNumber: "0102030405",
			version: 7,
			updatedAt: "2026-07-16T08:00:00.000Z" as any,
		}]));

		await store.dispatch<any>(savedCoffeesRetrieval());

		expect(savedCoffees.getCalls).toBe(1);
		expect(store.getState().scState.byCoffeeId["coffee-1"]).toMatchObject({
			name: "Café Belleville",
			addressLine: "12 rue des Fleurs",
			city: "Rennes",
			postalCode: "35000",
			country: "FR",
			version: 2,
		});
	});
});
