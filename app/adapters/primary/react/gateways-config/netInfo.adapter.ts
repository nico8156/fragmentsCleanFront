import NetInfo from "@react-native-community/netinfo";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";

type NetInfoAdapterOptions = {
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
        clearTimer();
        timer = setTimeout(() => {
            store.dispatch(outboxProcessOnce());
            timer = null;
        }, debounceMs);
    };

    const unsub = NetInfo.addEventListener((state) => {
        const online = Boolean(state.isConnected && state.isInternetReachable);
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
