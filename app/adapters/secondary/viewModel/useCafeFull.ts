import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useSelector} from "react-redux";
import {selectCoffeeFullVM} from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";

export function useCafeFull(id:CoffeeId) {

    const vm = useSelector(selectCoffeeFullVM(id))

    return {coffee : vm} as const;
}