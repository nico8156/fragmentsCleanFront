import type { Store } from "@reduxjs/toolkit";
import { mountNetInfoAdapter } from "@/app/adapters/primary/react/gateways-config/netInfo.adapter";
import { appConnectivityChanged } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

jest.mock("@react-native-community/netinfo", () => ({
    addEventListener: jest.fn(),
}));

describe("mountNetInfoAdapter", () => {
    let listeners: Array<(state: { isConnected?: boolean; isInternetReachable?: boolean }) => void> = [];

    beforeEach(() => {
        jest.useFakeTimers();
        listeners = [];
        (require("@react-native-community/netinfo").addEventListener as jest.Mock).mockImplementation((cb: any) => {
            listeners.push(cb);
            return () => {
                const index = listeners.indexOf(cb);
                if (index >= 0) listeners.splice(index, 1);
            };
        });
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        listeners = [];
    });

    it("dispatches connectivity changes and debounces reconnect callback", () => {
        const store = { dispatch: jest.fn() } as unknown as Store;
        const onReconnected = jest.fn();
        const teardown = mountNetInfoAdapter(store, { onReconnected, debounceMs: 500 });
        expect(listeners).toHaveLength(1);
        const fire = listeners[0];

        fire({ isConnected: false, isInternetReachable: false });
        fire({ isConnected: true, isInternetReachable: true });

        expect(store.dispatch).toHaveBeenLastCalledWith(appConnectivityChanged({ online: true }));
        expect(onReconnected).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);
        expect(onReconnected).toHaveBeenCalledTimes(1);
        teardown();
    });
});
