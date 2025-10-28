import {createAction} from "@reduxjs/toolkit";
import {OpeningHours} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.type";

export const openingHoursHydrated = createAction<{data:OpeningHours[]}>('SERVER/OPENING_HOURS_HYDRATED');