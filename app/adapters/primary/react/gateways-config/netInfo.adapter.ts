import NetInfo from "@react-native-community/netinfo";
import type { Store } from "@reduxjs/toolkit";
import {appConnectivityChanged} from "@/app/contextWL/appWl/typeAction/appWl.action";

export function mountNetInfoAdapter(store: Store) {
    const unsub = NetInfo.addEventListener((state) => {
        const online = Boolean(state.isConnected && state.isInternetReachable);
        store.dispatch(appConnectivityChanged({ online }));
    });
    return () => unsub();
}
