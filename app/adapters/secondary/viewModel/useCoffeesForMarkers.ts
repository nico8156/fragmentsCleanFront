import {useSelector} from "react-redux";
import {CoffeeOnMap, selectViewForMarkers} from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";

export function useCafeForMarkers() {

    const vm : CoffeeOnMap[] = useSelector(selectViewForMarkers)

    return {coffees : vm} as const;
}