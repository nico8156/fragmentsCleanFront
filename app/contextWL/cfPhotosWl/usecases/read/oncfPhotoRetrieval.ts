import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {PhotoURI} from "@/app/contextWL/cfPhotosWl/typeAction/cfPhoto.type";
import {photosHydrated} from "@/app/contextWL/cfPhotosWl/typeAction/cfPhoto.action";

export const onCfPhotoRetrieval = ():AppThunkWl<Promise<void>> =>
    async (dispatch, _, gateways) => {
    if(!gateways!.cfPhotos){
        dispatch(photosHydrated(
            {photos: [] as PhotoURI[]}
        ))
        return
    }
    try{
        const res =await gateways!.cfPhotos.getAllphotos()
        dispatch(photosHydrated(
            {photos: res.data}
        ))
    } catch (e) {
        console.log(e)
    }finally {
        return
    }
    }