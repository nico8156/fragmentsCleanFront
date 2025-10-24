import { CoffeeWlGateway } from "../../gateway/coffeeWl.gateway";
import { CoffeeId } from "../../typeAction/coffeeWl.type";
import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {
    coffeeRetrieved,
    coffeeSetError,
    coffeeSetLoading,
    coffeesHydrated
} from "@/app/contextWL/coffeeWl/reducer/coffeeWl.reducer";


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
        async (dispatch, _, coffeeWlGateway ) => {
            try {
                const { items } = await coffeeWlGateway!.coffees!.getAllSummaries();
                // Pas d’optimisme ici : c’est pure read
                dispatch(coffeesHydrated(items));
            } catch (e: any) {
                throw new Error("Error loading coffee global");
                //TODO create action error without params?
            }
        };

// Search (batch hydrate)
export const coffeesSearch =
    (input: Parameters<CoffeeWlGateway["search"]>[0]) :AppThunkWl<Promise<void>> =>
        async (dispatch, _, coffeeWlGateway) => {
            if(!coffeeWlGateway?.coffees)return
            const res = await coffeeWlGateway.coffees.search(input);
            dispatch(coffeesHydrated(res.items));
            //return res.nextCursor;
        };
