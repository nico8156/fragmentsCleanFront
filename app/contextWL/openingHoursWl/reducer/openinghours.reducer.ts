import {createReducer} from "@reduxjs/toolkit";
import {openingHoursHydrated} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.action";
import {AppStateWl} from "@/app/store/appStateWl";

const initialState: AppStateWl["openingHours"] = {
    byCoffeeId: {}
}

export const openingHoursReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(openingHoursHydrated, (state, action) => {
                const { data } = action.payload;
                data.forEach(d => {
                    if(!state.byCoffeeId[d.coffee_id]){
                        state.byCoffeeId[d.coffee_id] = []
                    }
                    if(!state.byCoffeeId[d.coffee_id].includes(d.weekday_description)){
                        state.byCoffeeId[d.coffee_id].push(d.weekday_description)
                    }
                })
            })
    }
)