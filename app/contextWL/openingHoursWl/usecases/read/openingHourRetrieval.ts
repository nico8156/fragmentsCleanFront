import {AppThunkWl} from "@/app/store/reduxStoreWl";
import { OpeningHours } from "../../typeAction/openingHours.type";
import {openingHoursHydrated} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.action";

export const onOpeningHourRetrieval = ():AppThunkWl<Promise<void>> =>
    async (dispatch, _, gateways) => {
        if(!gateways?.openingHours){
            dispatch(openingHoursHydrated(
                {data: [] as OpeningHours[]}))
            return
        }
        try {
            const res = await gateways.openingHours.getAllOpeningHours()
            dispatch(openingHoursHydrated({
                data:res.data
            }))
        }catch (e){
            console.log(String(e))
            dispatch(openingHoursHydrated(
                {data: [] as OpeningHours[]}))
        }finally {
            return
        }

    }