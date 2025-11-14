import NetInfo from "@react-native-community/netinfo";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";

type NetInfoAdapterOptions = {
    debounceMs?: number;
};

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;

export async function mountNetInfoAdapter(store: DispatchCapableStore, options?: NetInfoAdapterOptions) {
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

    try {
        const s = await NetInfo.fetch();
        lastOnline = Boolean(s.isConnected && (s.isInternetReachable ?? s.isConnected));
    } catch {
        lastOnline = false;
    }

    const unsub = NetInfo.addEventListener((state) => {
        // 🔹 Fallback si isInternetReachable est null/undefined
        const reachable = (state.isInternetReachable ?? state.isConnected);
        const online = Boolean(state.isConnected && reachable);

        if (online && !lastOnline) {
            scheduleReplay(); // transition offline -> online
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
