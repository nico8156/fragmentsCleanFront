import NetInfo from "@react-native-community/netinfo";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {appConnectivityChanged} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

type NetInfoAdapterOptions = {
    onReconnected?: () => void;
    debounceMs?: number;
};

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;

export function mountNetInfoAdapter(store: DispatchCapableStore, options?: NetInfoAdapterOptions) {
    let lastOnline = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounceMs = options?.debounceMs ?? 500;

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    const scheduleReplay = () => {
        if (!options?.onReconnected) return;
        clearTimer();
        timer = setTimeout(() => {
            options.onReconnected?.();
            timer = null;
        }, debounceMs);
    };

    const unsub = NetInfo.addEventListener((state) => {
        const online = Boolean(state.isConnected && state.isInternetReachable);
        store.dispatch(appConnectivityChanged({ online }));
        if (online && !lastOnline) {
            scheduleReplay();
        } else if (!online) {
            clearTimer();
        }
        lastOnline = online;
    });

    return () => {
        clearTimer();
        unsub();
    };
}
