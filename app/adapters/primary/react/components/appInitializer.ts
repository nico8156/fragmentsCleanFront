import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
    getOnceRequested,
    permissionCheckRequested,
} from "@/app/contextWL/locationWl/typeAction/location.action";
import { coffeeGlobalRetrieval } from "@/app/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import { onCfPhotoRetrieval } from "@/app/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { onOpeningHourRetrieval } from "@/app/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import { initializeAuth } from "@/app/contextWL/userWl/usecases/auth/authUsecases";

const AppInitializer = () => {
    const dispatch = useDispatch<any>();

    useEffect(() => {
        dispatch(initializeAuth());
        dispatch(permissionCheckRequested());
        dispatch(getOnceRequested({ accuracy: "high" }));
        dispatch(coffeeGlobalRetrieval());
        dispatch(onCfPhotoRetrieval());
        dispatch(onOpeningHourRetrieval());
    }, [dispatch]);

    return null;
};

export default AppInitializer;
