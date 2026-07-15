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
    currentStatePollMs?: number;
};

type AppStateLike = Pick<typeof AppState, "currentState" | "addEventListener"> & {
    removeEventListener?: (eventType: "change", listener: (state: AppStateStatus) => void) => void;
};

type TimerLike = {
    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
};

const DEFAULT_CURRENT_STATE_POLL_MS = 1_000;

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

export function mountAppStateAdapterWithRuntime(
    store: DispatchCapableStore,
    appState: AppStateLike,
    timer: TimerLike,
    opts?: AppStateAdapterOptions,
) {
    let mounted = true;
    let firstActiveSeen = false;

    let lastStatus: AppStateStatus | null = appState.currentState ?? null;
    let suspendedSinceLastResume = lastStatus === "inactive" || lastStatus === "background";

    const dispatchActiveTransition = (transition: "active" | "foreground") => {
        if (opts?.ignoreFirstActive && !firstActiveSeen) {
            firstActiveSeen = true;
            return;
        }
        firstActiveSeen = true;
        suspendedSinceLastResume = false;
        if (transition === "foreground") {
            store.dispatch(appBecameForeground());
            return;
        }
        store.dispatch(appBecameActive());
    };

    const handler = (status: AppStateStatus) => {
        if (!mounted) return;
        const transition = resolveAppLifecycleTransition(lastStatus, status);
        if (transition === "unchanged") return;
        lastStatus = status;

        if (transition === "active" || transition === "foreground") {
            dispatchActiveTransition(transition);
            return;
        }

        if (transition === "inactive") {
            suspendedSinceLastResume = true;
            store.dispatch(appBecameInactive());
            return;
        }

        if (transition === "background") {
            suspendedSinceLastResume = true;
            store.dispatch(appBecameBackground());
            return;
        }
    };

    const recoverCurrentActiveState = () => {
        if (!mounted) return;
        if (appState.currentState !== "active") return;
        if (lastStatus === "active" && !suspendedSinceLastResume) return;

        const transition =
            lastStatus === "background" || lastStatus === "inactive" || suspendedSinceLastResume
                ? "foreground"
                : "active";
        lastStatus = "active";
        dispatchActiveTransition(transition);
    };

    const subscription = appState.addEventListener("change", handler);
    const focusSubscription = appState.addEventListener?.("focus" as any, recoverCurrentActiveState as any);
    const pollMs = opts?.currentStatePollMs ?? DEFAULT_CURRENT_STATE_POLL_MS;
    const currentStatePoll =
        pollMs > 0
            ? timer.setInterval(() => {
                recoverCurrentActiveState();
                const currentStatus = appState.currentState;
                if (!currentStatus) return;
                handler(currentStatus);
            }, pollMs)
            : null;

    return () => {
        mounted = false;
        if (currentStatePoll) {
            timer.clearInterval(currentStatePoll);
        }
        try {
            focusSubscription?.remove?.();
            subscription?.remove?.();
        } catch {
            // RN legacy
            // @ts-ignore
            appState.removeEventListener?.("change", handler);
        }
    };
}

export function mountAppStateAdapter(store: DispatchCapableStore, opts?: AppStateAdapterOptions) {
    return mountAppStateAdapterWithRuntime(store, AppState, { setInterval, clearInterval }, opts);
}
