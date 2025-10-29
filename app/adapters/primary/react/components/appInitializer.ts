import {useDispatch} from "react-redux";
import {useEffect} from "react";
import {
    getOnceRequested,
    permissionCheckRequested,
    userLocationRequested
} from "@/app/contextWL/locationWl/typeAction/location.action";
import {coffeeGlobalRetrieval} from "@/app/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import {onCfPhotoRetrieval} from "@/app/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import {onOpeningHourRetrieval} from "@/app/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";


const AppInitializer = () => {
    const dispatch = useDispatch<any>()
    useEffect(() => {
        console.log("AppInitializer")
        dispatch(permissionCheckRequested())
        dispatch(getOnceRequested({accuracy:"high"}))
        dispatch(coffeeGlobalRetrieval())
        dispatch(onCfPhotoRetrieval())
        dispatch(onOpeningHourRetrieval())
    }, []);
    return null
}

export default AppInitializer