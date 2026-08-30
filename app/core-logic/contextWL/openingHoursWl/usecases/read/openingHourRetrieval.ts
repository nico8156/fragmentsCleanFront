import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {hoursHydrated} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.action";
import {logger} from "@/app/core-logic/utils/logger";

export const onOpeningHourRetrieval = ():AppThunkWl<Promise<void>> =>
    async (dispatch, _, gateways) => {
		if(!gateways?.openingHours){
			logger.warn("[OPENING_HOURS] gateway unavailable; keeping current cache")
            return
        }
        try {
            const res = await gateways.openingHours.getAllOpeningHours()
            dispatch(hoursHydrated({
                data:res.data
            }))
		}catch (error: any) {
			logger.warn("[OPENING_HOURS] retrieval failed; keeping current cache", {
				error: String(error?.message ?? error),
			})
        }finally {
            return
        }

    }
