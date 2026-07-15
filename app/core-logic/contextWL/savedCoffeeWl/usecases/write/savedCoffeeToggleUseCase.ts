import { createAction, createListenerMiddleware, nanoid, TypedStartListening } from "@reduxjs/toolkit";

import { computeSavedCoffeeId } from "@/app/adapters/secondary/gateways/savedCoffee/helpers/savedCoffeeId";
import { enqueueCommitted, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds, ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { selectSavedCoffeeById } from "@/app/core-logic/contextWL/savedCoffeeWl/selector/savedCoffee.selector";
import { savedCoffeeOptimisticSet } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";
import type { SavedCoffeeItem } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";
import type { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

export const uiSavedCoffeeToggleRequested = createAction<{ coffeeId: string }>(
	"UI/SAVED_COFFEE/TOGGLE_REQUESTED",
);

const fallbackFromCoffee = (state: RootStateWl, coffeeId: string): Partial<SavedCoffeeItem> | undefined => {
	const coffee = state.cfState?.byId?.[coffeeId];
	if (!coffee) return undefined;
	return {
		coffeeId,
		name: coffee.name ?? "Café",
		addressLine: coffee.address?.line1,
		city: coffee.address?.city,
		postalCode: coffee.address?.postalCode,
		country: coffee.address?.country,
	};
};

export const savedCoffeeToggleUseCaseFactory = (deps: DependenciesWl) => {
	const mw = createListenerMiddleware();
	const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

	listen({
		actionCreator: uiSavedCoffeeToggleRequested,
		effect: async ({ payload: { coffeeId } }, api) => {
			const userId = deps.gateways.authToken?.getCurrentUserId();
			const token = await deps.gateways.authToken?.getAccessToken();
			if (!userId || !token) return;

			const state = api.getState() as unknown as RootStateWl;
			const previous = selectSavedCoffeeById(coffeeId)(state);
			const currentlySaved = Boolean(previous);
			const nextSaved = !currentlySaved;
			const at = (deps.helpers?.nowIso?.() ?? new Date().toISOString()) as ISODate;
			const commandId = deps.helpers.newCommandId();
			const outboxId = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
			const savedCoffeeId = computeSavedCoffeeId(userId, coffeeId);

			api.dispatch(savedCoffeeOptimisticSet({
				coffeeId,
				value: nextSaved,
				commandId,
				at,
				fallback: fallbackFromCoffee(state, coffeeId),
			}));

			api.dispatch(enqueueCommitted({
				id: outboxId,
				item: {
					command: {
						kind: commandKinds.SavedCoffeeSet,
						commandId,
						savedCoffeeId,
						coffeeId,
						value: nextSaved,
						at,
					},
					undo: {
						kind: commandKinds.SavedCoffeeSet,
						coffeeId,
						prevSaved: currentlySaved,
						prevItem: previous,
					},
				},
				enqueuedAt: at,
			}));

			api.dispatch(outboxProcessOnce());
		},
	});

	return mw;
};
