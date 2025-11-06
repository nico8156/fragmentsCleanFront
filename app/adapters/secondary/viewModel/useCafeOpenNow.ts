import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {useSelector} from "react-redux";
import {useEffect, useMemo, useState} from "react";
import {isOpenNowFromWindows} from "@/app/core-logic/utils/time/isOpeningNow";
import {
    selectOpeningHoursForCoffeeId, selectOpeningHoursForCoffeeIdDayWindow
} from "@/app/core-logic/contextWL/openingHoursWl/selector/openingHours.selector";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import {DayWindow} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export function useCafeOpenNow(id: CoffeeId |null) {
    const selector = useMemo(() => {
        if (id == null) {
            return () => undefined as DayWindow[] | undefined;
        }
        return selectOpeningHoursForCoffeeIdDayWindow(id)
    }, [id])
    const data = useSelector(selector)
    // const windows = useSelector((state: RootStateWl) =>{
    //
    //     selectOpeningHoursForCoffeeId(id, state)
    // })

    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const t = setInterval(()=>setNow(new Date()), 60_000)
        return () => clearInterval(t)
        }, []);

    return useMemo(() => isOpenNowFromWindows(data ??[] , now), [data, now])
}