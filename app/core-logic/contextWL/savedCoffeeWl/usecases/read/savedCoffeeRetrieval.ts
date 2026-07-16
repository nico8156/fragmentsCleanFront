import type { AppThunkWl, RootStateWl } from "@/app/store/reduxStoreWl";
import {
	savedCoffeesRetrievalFailed,
	savedCoffeesRetrievalPending,
	savedCoffeesRetrieved,
} from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";
import type {
	SavedCoffeeItem,
} from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";

const GENERIC_COFFEE_NAME = "Café";

const hasText = (value?: string | null): value is string =>
	typeof value === "string" && value.trim().length > 0;

const isGenericName = (value?: string | null) =>
	!hasText(value) || value.trim() === GENERIC_COFFEE_NAME;

const firstText = (...values: (string | null | undefined)[]) =>
	values.find(hasText);

const enrichSavedCoffeeItem = (
	item: SavedCoffeeItem,
	state: RootStateWl,
): SavedCoffeeItem => {
	const coffee = state.cfState.byId[item.coffeeId];
	const previous = state.scState.byCoffeeId[item.coffeeId];
	const preferredName = firstText(coffee?.name, previous?.name, item.name) ?? GENERIC_COFFEE_NAME;

	return {
		...item,
		name: isGenericName(item.name) ? preferredName : item.name,
		addressLine: firstText(item.addressLine, coffee?.address?.line1, previous?.addressLine),
		city: firstText(item.city, coffee?.address?.city, previous?.city),
		postalCode: firstText(item.postalCode, coffee?.address?.postalCode, previous?.postalCode),
		country: firstText(item.country, coffee?.address?.country, previous?.country),
	};
};

export const savedCoffeesRetrieval = (): AppThunkWl<Promise<void>> =>
	async (dispatch, getState, gateways) => {
		const gateway = gateways?.savedCoffees;
		if (!gateway) {
			dispatch(savedCoffeesRetrievalFailed({ error: "saved coffees gateway not configured" }));
			return;
		}

		const controller = new AbortController();
		dispatch(savedCoffeesRetrievalPending());

		try {
			const snapshot = await gateway.get({ signal: controller.signal });
			const state = getState();
			dispatch(savedCoffeesRetrieved({
				...snapshot,
				items: snapshot.items.map((item) => enrichSavedCoffeeItem(item, state)),
			}));
		} catch (error: any) {
			dispatch(savedCoffeesRetrievalFailed({ error: String(error?.message ?? error) }));
		}
	};
