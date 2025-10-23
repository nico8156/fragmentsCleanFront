import { AppState, AppStateStatus } from "react-native";
import type { Store } from "@reduxjs/toolkit";
import {appBecameActive, appBecameBackground, appBecameInactive} from "@/app/contextWL/appWl/typeAction/appWl.action";

export function mountAppStateAdapter(store: Store) {
    let mounted = true;

    const handler = (status: AppStateStatus) => {
        if (!mounted) return;
        switch (status) {
            case "active":
                store.dispatch(appBecameActive());
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
