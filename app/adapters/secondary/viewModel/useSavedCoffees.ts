import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectSavedCoffeeItems, selectSavedCoffeeState } from "@/app/core-logic/contextWL/savedCoffeeWl/selector/savedCoffee.selector";
import { savedCoffeeLoadingStates } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";
import { savedCoffeesRetrieval } from "@/app/core-logic/contextWL/savedCoffeeWl/usecases/read/savedCoffeeRetrieval";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

export function useSavedCoffees() {
	const dispatch = useDispatch<AppDispatchWl>();
	const items = useSelector((state: RootStateWl) => selectSavedCoffeeItems(state));
	const state = useSelector((state: RootStateWl) => selectSavedCoffeeState(state));

	const refresh = useCallback(() => {
		dispatch(savedCoffeesRetrieval() as any);
	}, [dispatch]);

	useEffect(() => {
		if (state.loading !== savedCoffeeLoadingStates.IDLE) return;
		refresh();
	}, [refresh, state.loading]);

	return {
		items,
		isEmpty: items.length === 0,
		loading: state.loading,
		error: state.error,
		refresh,
	} as const;
}
