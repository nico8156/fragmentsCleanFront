import { CoffeeWlGateway } from "../../gateway/coffeeWl.gateway";
import { CoffeeId } from "../../typeAction/coffeeWl.type";
import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {
    coffeeSetError,
    coffeeSetLoading,
    coffeeListRequested, coffeeListFailed, coffeeListNotModified, coffeeCatalogueReceived,
	coffeeSearchRequested, coffeeSearchReceived, coffeeSearchFailed, coffeeSearchNotModified
	, coffeeDetailReceived, coffeeDetailNotModified
} from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";

let requestSequence = 0;
const nextRequestId = (scope: string) => `${scope}-${Date.now()}-${++requestSequence}`;

// Single coffee
export const coffeeRetrieval =
	({ id, ifNoneMatch }: { id: CoffeeId | string; ifNoneMatch?: string }) :AppThunkWl<Promise<void>> =>
		async (dispatch, getState, coffeeWlGateway ) => {
			const cachedEtag = getState().cfState.requests.byId[String(id)]?.etag;
			dispatch(coffeeSetLoading({ id }));
			try {
				const result = await coffeeWlGateway!.coffees!.get({ id: String(id), ifNoneMatch: ifNoneMatch ?? cachedEtag });
				if (result.kind === "not-modified") {
					dispatch(coffeeDetailNotModified({ id, etag: result.etag }));
					return;
				}
				// Pas d’optimisme ici : c’est pure read
				dispatch(coffeeDetailReceived({ coffee: result.data, etag: result.etag }));
            } catch (e: any) {
                dispatch(coffeeSetError({ id, message: e?.message ?? "coffee retrieval failed" }));
            }
        };
export const coffeeGlobalRetrieval =
    () :AppThunkWl<Promise<void>> =>
		async (dispatch, getState, coffeeWlGateway ) => {
			const requestId = nextRequestId("coffee-list");
			dispatch(coffeeListRequested({ requestId }));
            try {
				const currentEtag = getState().cfState.requests.list.etag;
				const result = await coffeeWlGateway!.coffees!.getAllSummaries({ ifNoneMatch: currentEtag });
				const fetchedAt = new Date().toISOString();
				if (result.kind === "not-modified") {
					dispatch(coffeeListNotModified({ requestId, etag: result.etag, fetchedAt }));
					return;
				}
                // Pas d’optimisme ici : c’est pure read
				dispatch(coffeeCatalogueReceived({ requestId, items: result.items, etag: result.etag, fetchedAt }));
			} catch (error: any) {
				dispatch(coffeeListFailed({ requestId, message: error?.message ?? "Error loading coffee global" }));
                throw new Error("Error loading coffee global");

            }
        };

// Search (batch hydrate)
export const coffeesSearch =
	(input: Parameters<CoffeeWlGateway["search"]>[0]) :AppThunkWl<Promise<void>> =>
		async (dispatch, getState, coffeeWlGateway) => {
			if (!coffeeWlGateway?.coffees) return;
			const requestId = nextRequestId("coffee-search");
			const query = input.query ?? "";
			const currentSearch = getState().cfState.requests.search;
			const mode = input.cursor && currentSearch.query === query ? "append" as const : "replace" as const;
			dispatch(coffeeSearchRequested({ requestId, query, mode }));
			try {
				const result = await coffeeWlGateway.coffees.search(input);
				if (result.kind === "not-modified") {
					dispatch(coffeeSearchNotModified({ requestId, query, etag: result.etag }));
					return;
				}
				dispatch(coffeeSearchReceived({ requestId, query, mode, ...result }));
			} catch (error: any) {
				dispatch(coffeeSearchFailed({ requestId, message: error?.message ?? "coffee search failed" }));
			}
		};
