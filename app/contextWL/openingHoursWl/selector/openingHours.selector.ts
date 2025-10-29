import {CoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import {toHoursByDayVM} from "@/app/core-logic/utils/time/timeFormator";
import {createSelector} from "@reduxjs/toolkit";

export const selectOpeningHoursForCoffeeId = (id:CoffeeId) =>
    (state:RootStateWl) => state.ohState.byCoffeeIdDayWindow[id] ?? [];

export const selectHoursByDayVM = (id: CoffeeId) =>
    createSelector(selectOpeningHoursForCoffeeId(id), toHoursByDayVM);
