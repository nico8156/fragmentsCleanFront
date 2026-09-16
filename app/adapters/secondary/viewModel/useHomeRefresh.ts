import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshHomeReadModels } from "@/app/core-logic/contextWL/appWl/usecases/refreshHomeReadModels";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

export function useHomeRefresh() {
    const dispatch = useDispatch<AppDispatchWl>();
    const userId = useSelector((state: RootStateWl) => state.aState.session?.userId);
    const online = useSelector((state: RootStateWl) => state.appState.online);
    const [message, setMessage] = useState<string>();
    useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(undefined), 4000); return () => clearTimeout(timer); }, [message]);
    const [refreshing, setRefreshing] = useState(false);
    const inFlight = useRef(false);
    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        if (!online) { setMessage("Hors ligne · contenu enregistré"); return; }
        inFlight.current = true;
        setRefreshing(true);
        try {
            setMessage(undefined);
            const result = await refreshHomeReadModels(dispatch, userId ? String(userId) : undefined);
            setMessage(result ? "À jour" : "Actualisation incomplète · réessaie");
        } finally {
            inFlight.current = false;
            setRefreshing(false);
        }
    }, [dispatch, userId, online]);
    return { refreshing, refresh, message } as const;
}
