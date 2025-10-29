import {CoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {useSelector} from "react-redux";
import {useEffect, useMemo, useState} from "react";
import {isOpenNowFromWindows} from "@/app/core-logic/utils/time/isOpeningNow";
import {
    selectOpeningHoursForCoffeeId
} from "@/app/contextWL/openingHoursWl/selector/openingHours.selector";

export function useCafeOpenNow(id: CoffeeId) {

    const windows = useSelector(selectOpeningHoursForCoffeeId(id))
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const t = setInterval(()=>setNow(new Date()), 60_000)
        return () => clearInterval(t)
        }, []);

    return useMemo(() => isOpenNowFromWindows(windows, now), [windows, now])
}