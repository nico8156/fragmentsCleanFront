import {createAction} from "@reduxjs/toolkit";
import {OpeningHours} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export const openingHoursHydrated = createAction<{data:OpeningHours[]}>('SERVER/OPENING_HOURS_HYDRATED');
export const hoursHydrated = createAction<{data:OpeningHours[]}>('SERVER/HOURS_HYDRATED');