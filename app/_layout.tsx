import { Stack } from 'expo-router';
import {Provider} from "react-redux";
import {initReduxStore} from "@/app/store/reduxStore";
import {gateways} from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";

export default function RootLayout() {

    const store = initReduxStore({
        gateways,
        })

  return (
        <Provider store={store}>
            <Stack screenOptions={{ headerShown: false }} />
        </Provider>
  );
}
