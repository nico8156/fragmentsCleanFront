import { AppState, AppStateStatus } from "react-native";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {
    appBecameActive,
    appBecameBackground,
    appBecameInactive,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

type AppStateAdapterOptions = {
    onActive?: () => void;
};

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;

export function mountAppStateAdapter(store: DispatchCapableStore, options?: AppStateAdapterOptions) {
    let mounted = true;

    const handler = (status: AppStateStatus) => {
        if (!mounted) return;
        switch (status) {
            case "active":
                store.dispatch(appBecameActive());
                options?.onActive?.();
                break;
            case "background":
                store.dispatch(appBecameBackground());
                break;
            case "inactive":
                store.dispatch(appBecameInactive());
                break;
            default:
                break;
        }
    };
    // RN >= 0.65 : addEventListener retourne un subscription avec .remove()
    const subscription = AppState.addEventListener("change", handler);

    // Dispatch initial selon l’état courant si tu veux
    // handler(AppState.currentState as AppStateStatus);

    return () => {
        mounted = false;
        try {
            // RN moderne
            subscription?.remove?.();
        } catch {
            // RN legacy fallback
            // @ts-ignore
            AppState.removeEventListener?.("change", handler);
        }
    };
}
