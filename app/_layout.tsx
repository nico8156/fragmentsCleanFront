import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { useEffect, useMemo } from "react";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { mountAppStateAdapter } from "@/app/adapters/primary/react/gateways-config/appState.adapter";
import { mountNetInfoAdapter } from "@/app/adapters/primary/react/gateways-config/netInfo.adapter";
import { gateways } from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import AppInitializer from "@/app/adapters/primary/react/components/appInitializer";
import { userLocationListenerFactory } from "@/app/core-logic/contextWL/locationWl/usecases/userLocationFactory";
import { authListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory";
import { AuthRouterGate } from "@/app/adapters/primary/react/components/authRouterGate";

export default function RootLayout() {
    const store = useMemo(
        () =>
            initReduxStoreWl({
                dependencies: {
                    gateways,
                    helpers: {},
                },
                listeners: [
                    authListenerFactory({ gateways, helpers: {} }),
                    userLocationListenerFactory({ gateways, helpers: {} }),
                ],
            }),
        [],
    );

    useEffect(() => {
        const unmountNetInfo = mountNetInfoAdapter(store);
        const unmountAppState = mountAppStateAdapter(store);
        return () => {
            unmountAppState();
            unmountNetInfo();
        };
    }, [store]);

    return (
        <Provider store={store}>
            <AuthRouterGate />
            <Stack screenOptions={{ headerShown: false }} />
            <AppInitializer />
        </Provider>
    );
}
