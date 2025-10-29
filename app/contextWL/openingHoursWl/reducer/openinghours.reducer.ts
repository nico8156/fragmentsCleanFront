import {createReducer} from "@reduxjs/toolkit";
import {hoursHydrated, openingHoursHydrated} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.action";
import {AppStateWl} from "@/app/store/appStateWl";
import {DayWindow} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.type";
import {parseWeekdayDescription} from "@/app/core-logic/utils/time/openingHoursParser";

const initialState: AppStateWl["openingHours"] = {
    byCoffeeIdDayWindow:{},
    byCoffeeId: {},
    statusByCoffeeId:{}
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
            .addCase(hoursHydrated, (state, action) => {
                const recs = action.payload.data as { coffee_id: string; weekday_description: string }[];
                // On regroupe par coffee_id et on remplace (source=vérité : serveur)
                const grouped: Record<string, DayWindow[]> = {};

                for (const r of recs) {
                    const parsed = parseWeekdayDescription(r.weekday_description);
                    const cid = String(r.coffee_id);
                    if (!grouped[cid]) grouped[cid] = [];
                    if (parsed) grouped[cid].push(...parsed.ranges);
                }

                for (const cid of Object.keys(grouped)) {
                    // Optionnel : trier par day/start pour cohérence
                    state.byCoffeeIdDayWindow[cid] = grouped[cid].sort((a,b) => a.day - b.day || a.start - b.start);
                    state.statusByCoffeeId[cid] = 'ok';
                }
            })
    }
)