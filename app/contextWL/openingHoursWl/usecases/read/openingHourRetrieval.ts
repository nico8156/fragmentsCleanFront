import {AppThunkWl} from "@/app/store/reduxStoreWl";
import { OpeningHours } from "../../typeAction/openingHours.type";
import {hoursHydrated} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.action";

export const onOpeningHourRetrieval = ():AppThunkWl<Promise<void>> =>
    async (dispatch, _, gateways) => {
        if(!gateways?.openingHours){
            dispatch(hoursHydrated(
                {data: [] as OpeningHours[]}))
            return
        }
        try {
            const res = await gateways.openingHours.getAllOpeningHours()
            dispatch(hoursHydrated({
                data:res.data
            }))
        }catch (e){
            console.log(String(e))
            dispatch(hoursHydrated(
                {data: [] as OpeningHours[]}))
        }finally {
            return
        }

    }