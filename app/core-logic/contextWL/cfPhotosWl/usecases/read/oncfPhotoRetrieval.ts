import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {PhotoURI} from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.type";
import {photosHydrated} from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import { logger } from "@/app/core-logic/utils/logger";

export const onCfPhotoRetrieval = ():AppThunkWl<Promise<boolean>> =>
    async (dispatch, _, gateways) => {
    if(!gateways!.cfPhotos){
        dispatch(photosHydrated(
            {photos: [] as PhotoURI[]}
        ))
        return false
    }
    try{
        const res =await gateways!.cfPhotos.getAllphotos()
        dispatch(photosHydrated(
            {photos: res.data}
        ))
        return true;
    } catch (error: any) {
        logger.warn("[CF_PHOTOS] retrieval failed; keeping current cache", {
            error: String(error?.message ?? error),
        });
		return false;
    }
    }
