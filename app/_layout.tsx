import { Stack } from 'expo-router';
import {Provider} from "react-redux";
import {initReduxStoreWl} from "@/app/store/reduxStoreWl";
import {useEffect} from "react";
import {mountAppStateAdapter} from "@/app/adapters/primary/react/gateways-config/appState.adapter";
import {mountNetInfoAdapter} from "@/app/adapters/primary/react/gateways-config/netInfo.adapter";
import {gateways} from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import AppInitializer from "@/app/adapters/primary/react/components/appInitializer";
import {userLocationListenerFactory} from "@/app/contextWL/locationWl/usecases/userLocationFactory";

export default function RootLayout() {
    const store = initReduxStoreWl({
        dependencies:{
            gateways,
            helpers:{}
        },
        listeners:[userLocationListenerFactory({gateways,helpers:{}}),

        ]
    })
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
            <AppInitializer/>
        </Provider>
  );
}
