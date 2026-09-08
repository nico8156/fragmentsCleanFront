import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    buildCoffeeDiscoveryResults,
    selectCoffeeDiscovery,
    selectCoffeeDiscoveryInputs
} from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import {
    coffeeDiscoveryOpenNowToggled,
    coffeeDiscoveryPhotosToggled,
    coffeeDiscoveryQueryChanged,
    coffeeDiscoverySortChanged,
    coffeeDiscoveryTagsChanged
} from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";
import type { CoffeeDiscoverySort } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

/** Unique source for list and map discovery; safe to use from the local cache. */
export function useCoffeeDiscovery() {
    const dispatch = useDispatch();
    const inputs = useSelector(selectCoffeeDiscoveryInputs);
    const preferences = useSelector(selectCoffeeDiscovery);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const coffees = useMemo(() => buildCoffeeDiscoveryResults({ ...inputs, now }), [inputs, now]);

    return {
        coffees,
        preferences,
        isUsingCachedCatalogue: inputs.coffees.length > 0 && inputs.catalogueStatus === "error",
        hasLocation: inputs.userCoords !== null,
        setQuery: (query: string) => dispatch(coffeeDiscoveryQueryChanged({ query })),
        setOnlyOpenNow: (enabled: boolean) => dispatch(coffeeDiscoveryOpenNowToggled({ enabled })),
        setOnlyWithPhotos: (enabled: boolean) => dispatch(coffeeDiscoveryPhotosToggled({ enabled })),
        setRequiredTags: (tags: string[]) => dispatch(coffeeDiscoveryTagsChanged({ tags })),
        setSort: (sort: CoffeeDiscoverySort) => dispatch(coffeeDiscoverySortChanged({ sort }))
    } as const;
}
