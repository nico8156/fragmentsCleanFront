import { AppState, AppStateStatus } from "react-native";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { replayRequested, syncDecideRequested } from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;
type AppStateAdapterOptions = { ignoreFirstActive?: boolean; };

export function mountAppStateAdapter(store: DispatchCapableStore,opts?: AppStateAdapterOptions) {
    let mounted = true;
    let firstActiveHandled = false;


    const handler = (status: AppStateStatus) => {
        if (!mounted) return;

        if (status === "active") {
            if (opts?.ignoreFirstActive && !firstActiveHandled) {
                firstActiveHandled = true;
                return; // on ignore le tout premier active
            }
            store.dispatch(replayRequested());
            store.dispatch(outboxProcessOnce());
            store.dispatch(syncDecideRequested());
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
