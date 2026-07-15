import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectSavedCoffeeById } from "@/app/core-logic/contextWL/savedCoffeeWl/selector/savedCoffee.selector";
import { uiSavedCoffeeToggleRequested } from "@/app/core-logic/contextWL/savedCoffeeWl/usecases/write/savedCoffeeToggleUseCase";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

export function useSavedCoffeeForCafe(coffeeId?: string | null) {
	const dispatch = useDispatch<AppDispatchWl>();
	const selector = useMemo(() => selectSavedCoffeeById(coffeeId), [coffeeId]);
	const item = useSelector((state: RootStateWl) => selector(state));

	const toggle = useCallback(() => {
		if (!coffeeId) return;
		dispatch(uiSavedCoffeeToggleRequested({ coffeeId }));
	}, [coffeeId, dispatch]);

	return {
		saved: Boolean(item),
		item,
		isOptimistic: Boolean(item?.optimistic),
		toggle,
	} as const;
}
