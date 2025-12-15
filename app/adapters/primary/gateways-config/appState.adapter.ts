import { AppState, AppStateStatus } from "react-native";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {appBecameActive, appBecameBackground} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;
type AppStateAdapterOptions = { ignoreFirstActive?: boolean; };

export function mountAppStateAdapter(
    store: DispatchCapableStore,
    opts?: AppStateAdapterOptions,
) {
    let mounted = true;
    let firstActiveHandled = false;

    const handler = (status: AppStateStatus) => {
        if (!mounted) return;

        if (status === "active") {
            if (opts?.ignoreFirstActive && !firstActiveHandled) {
                firstActiveHandled = true;
                return;
            }
            store.dispatch(appBecameActive());
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
