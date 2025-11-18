// /app/_layout.tsx (ou RootLayout.tsx selon ton projet)
import { Provider } from "react-redux";
import { createWlStore } from "@/app/adapters/primary/react/wiring/setupGateways";
import { AppBootstrap } from "@/app/adapters/primary/react/AppBootstrap";
import { RootNavigator } from "@/app/adapters/primary/react/navigation/RootNavigator";

const store = createWlStore();

export default function RootLayout() {
    return (
        <Provider store={store}>
            <AppBootstrap />
            <RootNavigator />
        </Provider>
    );
}
