import { Provider } from "react-redux";
import { useEffect, useMemo } from "react";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { mountAppStateAdapter } from "@/app/adapters/primary/react/gateways-config/appState.adapter";
import { mountNetInfoAdapter } from "@/app/adapters/primary/react/gateways-config/netInfo.adapter";
import { gateways } from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import AppInitializer from "@/app/adapters/primary/react/components/appInitializer";
import { userLocationListenerFactory } from "@/app/core-logic/contextWL/locationWl/usecases/userLocationFactory";
import { authListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory";
import { ticketSubmitUseCaseFactory } from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";
import { createCommentUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { RootNavigator } from "@/app/adapters/primary/react/navigation/RootNavigator";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

let storeRef: ReduxStoreWl | null = null;

export default function RootLayout() {
    const store = useMemo(
        () =>
            {
                const helpers = {
                    nowIso: () => new Date().toISOString() as any,
                    currentUserId: () => storeRef?.getState().aState.currentUser?.id ?? "anonymous",
                };

                const ticketSubmitMiddleware = ticketSubmitUseCaseFactory({
                    gateways,
                    helpers,
                });
                const commentCreateMiddleware = createCommentUseCaseFactory({
                    gateways,
                    helpers,
                }).middleware;
                const outboxMiddleware = processOutboxFactory({
                    gateways,
                    helpers,
                }).middleware;

                const createdStore = initReduxStoreWl({
                    dependencies: {
                        gateways,
                        helpers: {},
                    },
                    listeners: [
                        commentCreateMiddleware,
                        outboxMiddleware,
                        ticketSubmitMiddleware,
                        authListenerFactory({ gateways, helpers: {} }),
                        userLocationListenerFactory({ gateways, helpers: {} }),
                    ],
                });
                storeRef = createdStore;
                return createdStore;
            },
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
            <RootNavigator />
            <AppInitializer />
        </Provider>
    );
}
