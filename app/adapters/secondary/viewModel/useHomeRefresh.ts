import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshHomeReadModels } from "@/app/core-logic/contextWL/appWl/usecases/refreshHomeReadModels";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

export function useHomeRefresh() {
    const dispatch = useDispatch<AppDispatchWl>();
    const userId = useSelector((state: RootStateWl) => state.aState.session?.userId);
    const [refreshing, setRefreshing] = useState(false);
    const inFlight = useRef(false);
    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setRefreshing(true);
        try {
            await refreshHomeReadModels(dispatch, userId ? String(userId) : undefined);
        } finally {
            inFlight.current = false;
            setRefreshing(false);
        }
    }, [dispatch, userId]);
    return { refreshing, refresh } as const;
}
