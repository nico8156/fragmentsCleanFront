import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useSelector} from "react-redux";
import {
    CafeFullVM,
    selectCoffeeFullVM,
} from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import {useMemo} from "react";

export function useCafeFull(id:CoffeeId | null) {

    const selector = useMemo(() => {
        if (id == null) {
            // selector "dummy" qui renvoie toujours undefined
            return () => undefined as CafeFullVM | undefined;
        }
        return selectCoffeeFullVM(id);
    }, [id]);

    const vm = useSelector(selector);
    return {coffee : vm} as const;
}
