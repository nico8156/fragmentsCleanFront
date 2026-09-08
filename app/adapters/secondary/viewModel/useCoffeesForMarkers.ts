import { CoffeeOnMap } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { useCoffeeDiscovery } from "@/app/adapters/secondary/viewModel/useCoffeeDiscovery";

export function useCafeForMarkers() {
    const { coffees } = useCoffeeDiscovery();
    const markers: CoffeeOnMap[] = coffees.map(({ id, name, location }) => ({ id, name, location }));
    return { coffees: markers } as const;
}
