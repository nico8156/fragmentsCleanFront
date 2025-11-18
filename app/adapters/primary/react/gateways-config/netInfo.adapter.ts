import NetInfo from "@react-native-community/netinfo";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { appConnectivityChanged } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

type NetInfoAdapterOptions = {
    debounceMs?: number;
};

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;

export function mountNetInfoAdapter(
    store: DispatchCapableStore,
    options?: NetInfoAdapterOptions,
) {
    let lastOnline = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounceMs = options?.debounceMs ?? 500;

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    const scheduleConnectivityChanged = (online: boolean) => {
        clearTimer();
        timer = setTimeout(() => {
            store.dispatch(appConnectivityChanged({ online }));
            timer = null;
        }, debounceMs);
    };

    NetInfo.fetch()
        .then((s) => {
            lastOnline = Boolean(
                s.isConnected && (s.isInternetReachable ?? s.isConnected),
            );
            // tu peux éventuellement faire un appConnectivityChanged initial ici
        })
        .catch(() => {
            lastOnline = false;
        });

    const unsub = NetInfo.addEventListener((state) => {
        const reachable = state.isInternetReachable ?? state.isConnected;
        const online = Boolean(state.isConnected && reachable);

        if (online !== lastOnline) {
            // on notifie le changement à appWl
            scheduleConnectivityChanged(online);
        }

        lastOnline = online;
    });

    return () => {
        clearTimer();
        unsub();
    };
}
