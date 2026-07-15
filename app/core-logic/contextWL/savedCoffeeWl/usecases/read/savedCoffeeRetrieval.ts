import type { AppThunkWl } from "@/app/store/reduxStoreWl";
import {
	savedCoffeesRetrievalFailed,
	savedCoffeesRetrievalPending,
	savedCoffeesRetrieved,
} from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";

export const savedCoffeesRetrieval = (): AppThunkWl<Promise<void>> =>
	async (dispatch, _getState, gateways) => {
		const gateway = gateways?.savedCoffees;
		if (!gateway) {
			dispatch(savedCoffeesRetrievalFailed({ error: "saved coffees gateway not configured" }));
			return;
		}

		const controller = new AbortController();
		dispatch(savedCoffeesRetrievalPending());

		try {
			const snapshot = await gateway.get({ signal: controller.signal });
			dispatch(savedCoffeesRetrieved(snapshot));
		} catch (error: any) {
			dispatch(savedCoffeesRetrievalFailed({ error: String(error?.message ?? error) }));
		}
	};
