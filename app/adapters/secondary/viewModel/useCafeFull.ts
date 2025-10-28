import {CoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useSelector} from "react-redux";
import {selectCoffeeFullVM} from "@/app/contextWL/coffeeWl/selector/coffeeWl.selector";

export function useCafeFull(id:CoffeeId) {

    const vm = useSelector(selectCoffeeFullVM(id))

    return {coffee : vm} as const;
}