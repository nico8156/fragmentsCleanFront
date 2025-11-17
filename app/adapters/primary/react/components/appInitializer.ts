import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
    getOnceRequested,
    requestPermission,
} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";
import { coffeeGlobalRetrieval } from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import { onCfPhotoRetrieval } from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { onOpeningHourRetrieval } from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import { initializeAuth } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";

const AppInitializer = () => {
    const dispatch = useDispatch<any>();

    useEffect(() => {
        dispatch(initializeAuth());
        dispatch(requestPermission());
        dispatch(getOnceRequested({ accuracy: "high" }));
        dispatch(coffeeGlobalRetrieval());
        dispatch(onCfPhotoRetrieval());
        dispatch(onOpeningHourRetrieval());
    }, [dispatch]);

    return null;
};

export default AppInitializer;
