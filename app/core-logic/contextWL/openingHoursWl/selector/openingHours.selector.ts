// openingHours.selector.ts
import {RootStateWl} from "@/app/store/reduxStoreWl";
import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {createSelector} from "@reduxjs/toolkit";
import {toHoursByDayVM} from "@/app/core-logic/utils/time/timeFormator";
import {DayWindow, HoursByDayVM} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";


// input selector : slice opening hours
const selectOhState = (state: RootStateWl) => state.ohState;

// toutes les fenêtres, non filtrées
const selectByCoffeeIdDayWindow = (state: RootStateWl) =>
    selectOhState(state).byCoffeeIdDayWindow;

// input selector avec props (coffeeId)
const selectDayWindowsForCoffee = (
    state: RootStateWl,
    coffeeId: CoffeeId | null
): DayWindow[] | undefined => {
    if (coffeeId == null) return undefined;
    return selectByCoffeeIdDayWindow(state)[coffeeId];
};

// DayWindow[] pour un café
export const selectOpeningHoursForCoffeeIdDayWindow = createSelector(
    [selectDayWindowsForCoffee],
    (hours): DayWindow[] => {
        if (!hours) return [];
        // on renvoie une nouvelle référence pour éviter le warning Reselect
        return [...hours];
    }
);

// HoursByDayVM pour un café
export const selectHoursByDayVM = createSelector(
    [selectDayWindowsForCoffee],
    (hours): HoursByDayVM => {
        return toHoursByDayVM(hours ?? []);
    }
);
