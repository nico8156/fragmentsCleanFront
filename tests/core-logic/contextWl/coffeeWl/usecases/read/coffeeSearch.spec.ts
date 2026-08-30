import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {coffeesSearch} from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";


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
            id: "a",googleId:"nfsmqn5s4<q1", name: "Lomi", location: { lat: 48.889, lon: 2.358 },
            address: { city: "Paris", country: "FR" },phoneNumber:"014256897452", tags: ["roaster"], version: 1, updatedAt: "2025-10-10T08:05:00.000Z" as any,
        });
        coffeeGateway.store.set("b", {
            id: "b",googleId:"chsqmu=bhcfqsu", name: "Café Joyeux", location: { lat: 48.114, lon: -1.678 },
            address: { city: "Rennes", country: "FR" },phoneNumber:"014287549832", tags: ["espresso"], version: 2, updatedAt: "2025-10-10T08:06:00.000Z" as any,
        });

		await store.dispatch<any>(coffeesSearch({ query: "espresso" }));

        const state: any = store.getState();
        expect(Object.keys(state.cfState.byId)).toContain("b");
        expect(Object.keys(state.cfState.byId)).not.toContain("a");
		expect(state.cfState.requests.search).toMatchObject({
			status: "success",
			ids: ["b"],
		});
	});

	it("appends a next page without losing the first page", async () => {
		coffeeGateway.search = jest.fn()
			.mockResolvedValueOnce({ kind: "updated", items: [coffee("a", "Alpha")], nextCursor: "page-2", etag: '"search-v1"' })
			.mockResolvedValueOnce({ kind: "updated", items: [coffee("b", "Beta")], etag: '"search-v1"' });
		await store.dispatch<any>(coffeesSearch({ query: "café", limit: 1 }));
		await store.dispatch<any>(coffeesSearch({ query: "café", limit: 1, cursor: "page-2" }));
		expect((store.getState() as any).cfState.requests.search).toMatchObject({
			status: "success", query: "café", ids: ["a", "b"], nextCursor: undefined,
		});
	});

	it("keeps search results and completes loading on not modified", async () => {
		coffeeGateway.search = jest.fn()
			.mockResolvedValueOnce({ kind: "updated", items: [coffee("a", "Alpha")], etag: '"search-v1"' })
			.mockResolvedValueOnce({ kind: "not-modified", etag: '"search-v1"' });
		await store.dispatch<any>(coffeesSearch({ query: "alpha" }));
		await store.dispatch<any>(coffeesSearch({ query: "alpha", ifNoneMatch: '"search-v1"' }));
		expect((store.getState() as any).cfState.requests.search).toMatchObject({
			status: "success", query: "alpha", ids: ["a"], etag: '"search-v1"',
		});
	});

	it("ignores a stale response from a previous query", async () => {
		const paris = deferred<any>();
		const rennes = deferred<any>();
		coffeeGateway.search = jest.fn()
			.mockImplementationOnce(() => paris.promise)
			.mockImplementationOnce(() => rennes.promise);
		const first = store.dispatch<any>(coffeesSearch({ query: "Paris" }));
		const second = store.dispatch<any>(coffeesSearch({ query: "Rennes" }));
		rennes.resolve({ kind: "updated", items: [coffee("rennes", "Rennes Café")] });
		await second;
		paris.resolve({ kind: "updated", items: [coffee("paris", "Paris Café")] });
		await first;
		expect((store.getState() as any).cfState.requests.search).toMatchObject({
			status: "success", query: "Rennes", ids: ["rennes"],
		});
	});
});

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => { resolve = res; });
	return { promise, resolve };
}

function coffee(id: string, name: string) {
	return {
		id, name, location: { lat: 48.11, lon: -1.67 }, address: { city: "Rennes" }, tags: [], version: 1,
		updatedAt: "2026-08-29T10:00:00Z" as any,
	};
}
