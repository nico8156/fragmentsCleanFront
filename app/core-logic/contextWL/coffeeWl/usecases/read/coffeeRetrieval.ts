import { CoffeeWlGateway } from "../../gateway/coffeeWl.gateway";
import { CoffeeId } from "../../typeAction/coffeeWl.type";
import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {
    coffeeRetrieved,
    coffeeSetError,
    coffeeSetLoading,
    coffeesHydrated, coffeeListRequested, coffeeListFailed, coffeeListNotModified,
	coffeeListMetadataReceived, coffeeSearchRequested, coffeeSearchReceived, coffeeSearchFailed
} from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";


// Single coffee
export const coffeeRetrieval =
    ({ id, ifNoneMatch }: { id: CoffeeId | string; ifNoneMatch?: string }) :AppThunkWl<Promise<void>> =>
        async (dispatch, _, coffeeWlGateway ) => {
            dispatch(coffeeSetLoading({ id }));
            try {
                const { data } = await coffeeWlGateway!.coffees!.get({ id: String(id), ifNoneMatch });
                // Pas d’optimisme ici : c’est pure read
                dispatch(coffeeRetrieved(data));
            } catch (e: any) {
                dispatch(coffeeSetError({ id, message: e?.message ?? "coffee retrieval failed" }));
            }
        };
export const coffeeGlobalRetrieval =
    () :AppThunkWl<Promise<void>> =>
		async (dispatch, getState, coffeeWlGateway ) => {
			dispatch(coffeeListRequested());
            try {
				const currentEtag = getState().cfState.requests.list.etag;
				const result = await coffeeWlGateway!.coffees!.getAllSummaries({ ifNoneMatch: currentEtag });
				const fetchedAt = new Date().toISOString();
				if (result.kind === "not-modified") {
					dispatch(coffeeListNotModified({ etag: result.etag, fetchedAt }));
					return;
				}
                // Pas d’optimisme ici : c’est pure read
				dispatch(coffeesHydrated(result.items));
				dispatch(coffeeListMetadataReceived({ etag: result.etag, fetchedAt }));
			} catch (error: any) {
				dispatch(coffeeListFailed({ message: error?.message ?? "Error loading coffee global" }));
                throw new Error("Error loading coffee global");

            }
        };

// Search (batch hydrate)
export const coffeesSearch =
	(input: Parameters<CoffeeWlGateway["search"]>[0]) :AppThunkWl<Promise<void>> =>
		async (dispatch, _, coffeeWlGateway) => {
			if (!coffeeWlGateway?.coffees) return;
			dispatch(coffeeSearchRequested());
			try {
				const result = await coffeeWlGateway.coffees.search(input);
				if (result.kind === "not-modified") return;
				dispatch(coffeeSearchReceived(result));
			} catch (error: any) {
				dispatch(coffeeSearchFailed({ message: error?.message ?? "coffee search failed" }));
			}
		};
