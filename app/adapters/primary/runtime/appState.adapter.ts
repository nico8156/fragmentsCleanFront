import { AppState, AppStateStatus } from "react-native";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { appBecameActive, appBecameBackground, appBecameInactive } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;

type AppStateAdapterOptions = {
    ignoreFirstActive?: boolean;
};

export function mountAppStateAdapter(store: DispatchCapableStore, opts?: AppStateAdapterOptions) {
    let mounted = true;
    let firstActiveSeen = false;

    let lastStatus: AppStateStatus | null = AppState.currentState ?? null;

    const handler = (status: AppStateStatus) => {
        if (!mounted) return;
        if (status === lastStatus) return;
        lastStatus = status;

        if (status === "active") {
            if (opts?.ignoreFirstActive && !firstActiveSeen) {
                firstActiveSeen = true;
                return;
            }
            firstActiveSeen = true;
            store.dispatch(appBecameActive());
            return;
        }

        if (status === "inactive") {
            store.dispatch(appBecameInactive());
            return;
        }

        if (status === "background") {
            store.dispatch(appBecameBackground());
            return;
        }
    };

    const subscription = AppState.addEventListener("change", handler);

    return () => {
        mounted = false;
        try {
            subscription?.remove?.();
        } catch {
            // RN legacy
            // @ts-ignore
            AppState.removeEventListener?.("change", handler);
        }
    };
}
