import { Stack } from 'expo-router';
import {Provider} from "react-redux";
import {initReduxStoreWl} from "@/app/store/reduxStoreWl";
import {useEffect} from "react";
import {mountAppStateAdapter} from "@/app/adapters/primary/react/gateways-config/appState.adapter";
import {mountNetInfoAdapter} from "@/app/adapters/primary/react/gateways-config/netInfo.adapter";

const store = initReduxStoreWl({
    dependencies:{}
})

export default function RootLayout() {
    useEffect(() => {
        const unmountNetInfo = mountNetInfoAdapter(store);
        const unmountAppState = mountAppStateAdapter(store);
        return () => {
            unmountAppState();
            unmountNetInfo();
        };
    }, []);
  return (
        <Provider store={store}>
            <Stack screenOptions={{ headerShown: false }} />
        </Provider>
  );
}
