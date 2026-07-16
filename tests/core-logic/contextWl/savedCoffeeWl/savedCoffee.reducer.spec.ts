import { readModelCacheRehydrated } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";
import { savedCoffeeReducer } from "@/app/core-logic/contextWL/savedCoffeeWl/reducer/savedCoffee.reducer";
import {
	savedCoffeeOptimisticSet,
	savedCoffeeReconciled,
	savedCoffeeRollback,
	savedCoffeesRetrieved,
} from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";
import { savedCoffeeLoadingStates } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";

describe("savedCoffeeReducer", () => {
	it("hydrates saved coffees from durable read-model cache", () => {
		const state = savedCoffeeReducer(undefined, readModelCacheRehydrated({
			savedCoffees: {
				byCoffeeId: {
					"coffee-1": {
						coffeeId: "coffee-1",
						name: "Cafe cache",
						savedAt: "2026-07-15T09:00:00.000Z",
						version: 3,
					},
				},
				ids: ["coffee-1"],
				version: 3,
				loading: savedCoffeeLoadingStates.SUCCESS,
			},
			schemaVersion: 1,
			updatedAt: "2026-07-15T09:00:00.000Z",
		}));

		expect(state.ids).toEqual(["coffee-1"]);
		expect(state.byCoffeeId["coffee-1"]).toMatchObject({
			name: "Cafe cache",
			version: 3,
		});
	});

	it("keeps a local optimistic save while applying a server snapshot", () => {
		const optimistic = savedCoffeeReducer(undefined, savedCoffeeOptimisticSet({
			coffeeId: "coffee-local",
			value: true,
			commandId: "cmd-local",
			at: "2026-07-15T10:00:00.000Z",
			fallback: { name: "Cafe local" },
		}));

		const state = savedCoffeeReducer(optimistic, savedCoffeesRetrieved({
			items: [{
				coffeeId: "coffee-server",
				name: "Cafe server",
				savedAt: "2026-07-15T09:30:00.000Z",
				version: 8,
			}],
			version: 8,
		}));

		expect(state.ids).toEqual(["coffee-local", "coffee-server"]);
		expect(state.byCoffeeId["coffee-local"]).toMatchObject({
			optimistic: true,
			pendingCommandId: "cmd-local",
		});
		expect(state.byCoffeeId["coffee-server"]).toMatchObject({
			name: "Cafe server",
		});
		expect(state.byCoffeeId["coffee-server"]).not.toHaveProperty("optimistic");
	});

	it("reconciles applied saves and rolls rejected removals back to the previous item", () => {
		const previous = {
			coffeeId: "coffee-1",
			name: "Cafe before",
			savedAt: "2026-07-15T08:00:00.000Z",
			version: 4,
		};
		const loaded = savedCoffeeReducer(undefined, savedCoffeesRetrieved({
			items: [previous],
			version: 4,
		}));
		const removed = savedCoffeeReducer(loaded, savedCoffeeOptimisticSet({
			coffeeId: "coffee-1",
			value: false,
			commandId: "cmd-remove",
			at: "2026-07-15T10:00:00.000Z",
		}));

		expect(removed.byCoffeeId["coffee-1"]).toBeUndefined();

		const rolledBack = savedCoffeeReducer(removed, savedCoffeeRollback({
			coffeeId: "coffee-1",
			prevSaved: true,
			prevItem: previous,
		}));
		const saved = savedCoffeeReducer(rolledBack, savedCoffeeOptimisticSet({
			coffeeId: "coffee-2",
			value: true,
			commandId: "cmd-save",
			at: "2026-07-15T11:00:00.000Z",
			fallback: { name: "Cafe after" },
		}));
		const reconciled = savedCoffeeReducer(saved, savedCoffeeReconciled({
			coffeeId: "coffee-2",
			commandId: "cmd-save",
		}));

		expect(rolledBack.byCoffeeId["coffee-1"]).toEqual(previous);
		expect(reconciled.byCoffeeId["coffee-2"]).toMatchObject({
			optimistic: false,
		});
		expect(reconciled.byCoffeeId["coffee-2"]).not.toHaveProperty("pendingCommandId");
	});
});
