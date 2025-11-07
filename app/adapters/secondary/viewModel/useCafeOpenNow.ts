// useCafeOpenNow.ts
import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {useEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import {
    selectOpeningHoursForCoffeeIdDayWindow
} from "@/app/core-logic/contextWL/openingHoursWl/selector/openingHours.selector";
import {isOpenNowFromWindows} from "@/app/core-logic/utils/time/isOpeningNow";

export function useCafeOpenNow(id: CoffeeId | null) {
    const [now, setNow] = useState(() => new Date());

    const windows = useSelector((state: RootStateWl) =>
        selectOpeningHoursForCoffeeIdDayWindow(state, id)
    );

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    return useMemo(
        () => isOpenNowFromWindows(windows, now),
        [windows, now]
    );
}
