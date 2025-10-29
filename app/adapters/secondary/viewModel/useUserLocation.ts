// adapters/presentation/hooks/useUserLocationFromStore.ts
import { useDispatch, useSelector } from 'react-redux';
import {
    selectLocationLastUpdated,
    selectLocationPermission,
    selectLocationStatus,
    selectUserCoords
} from "@/app/contextWL/locationWl/selector/location.selector";
import {
    getOnceRequested,
    permissionCheckRequested, requestPermission,
    stopWatchRequested
} from "@/app/contextWL/locationWl/typeAction/location.action";


export function useUserLocationFromStore() {
    const dispatch = useDispatch();
    const coords = useSelector(selectUserCoords);
    const status = useSelector(selectLocationStatus);
    const permission = useSelector(selectLocationPermission);
    const lastUpdated = useSelector(selectLocationLastUpdated);

    return {
        coords, status, permission, lastUpdated,
        refresh: () => dispatch(getOnceRequested({accuracy:"balanced"})),
        startWatch: (opts?: any) => dispatch({ type: 'Location/StartWatchRequested', payload: opts }),
        stopWatch: () => dispatch(stopWatchRequested()),
        checkPermission: () => dispatch(permissionCheckRequested()),
        requestPermission: () => dispatch(requestPermission()),
    } as const;
}
