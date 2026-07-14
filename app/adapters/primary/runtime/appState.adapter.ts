import { AppState, AppStateStatus } from "react-native";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {
    appBecameActive,
    appBecameBackground,
    appBecameForeground,
    appBecameInactive,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;

type AppStateAdapterOptions = {
    ignoreFirstActive?: boolean;
};

export type AppLifecycleTransition =
    | "active"
    | "foreground"
    | "inactive"
    | "background"
    | "unchanged";

export const resolveAppLifecycleTransition = (
    previousStatus: AppStateStatus | null,
    nextStatus: AppStateStatus,
): AppLifecycleTransition => {
    if (nextStatus === previousStatus) return "unchanged";

    if (nextStatus === "active") {
        return previousStatus === "background" || previousStatus === "inactive"
            ? "foreground"
            : "active";
    }

    if (nextStatus === "inactive") return "inactive";
    if (nextStatus === "background") return "background";
    return "unchanged";
};

export function mountAppStateAdapter(store: DispatchCapableStore, opts?: AppStateAdapterOptions) {
    let mounted = true;
    let firstActiveSeen = false;

    let lastStatus: AppStateStatus | null = AppState.currentState ?? null;

    const handler = (status: AppStateStatus) => {
        if (!mounted) return;
        const transition = resolveAppLifecycleTransition(lastStatus, status);
        if (transition === "unchanged") return;
        lastStatus = status;

        if (transition === "active" || transition === "foreground") {
            if (opts?.ignoreFirstActive && !firstActiveSeen) {
                firstActiveSeen = true;
                return;
            }
            firstActiveSeen = true;
            if (transition === "foreground") {
                store.dispatch(appBecameForeground());
                return;
            }
            store.dispatch(appBecameActive());
            return;
        }

        if (transition === "inactive") {
            store.dispatch(appBecameInactive());
            return;
        }

        if (transition === "background") {
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
