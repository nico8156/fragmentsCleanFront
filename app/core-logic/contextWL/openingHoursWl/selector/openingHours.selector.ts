import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import {toHoursByDayVM} from "@/app/core-logic/utils/time/timeFormator";
import {createSelector} from "@reduxjs/toolkit";
import {DayWindow} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export const selectOpeningHoursForCoffeeId = (id:CoffeeId,state:RootStateWl) =>
    state.ohState.byCoffeeIdDayWindow[id];

export const selectOpeningHoursForCoffeeIdDayWindow =(id:CoffeeId) => createSelector(
    [
        (s:RootStateWl) => selectOpeningHoursForCoffeeId(id, s),
    ],
    (hours) :DayWindow[] => hours ?? [] as DayWindow[]
)

export const selectHoursByDayVM = createSelector(
    [
        (id: CoffeeId, state: RootStateWl ) => selectOpeningHoursForCoffeeId(id, state),
    ],
    (hours) => toHoursByDayVM(hours ?? [])
)
