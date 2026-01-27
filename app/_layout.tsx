import { useMemo } from "react";
import { Provider } from "react-redux";

import { AppBootstrap } from "@/app/adapters/primary/react/AppBootstrap";
import { RootNavigator } from "@/app/adapters/primary/react/navigation/RootNavigator";
import { createWlStore } from "@/app/adapters/primary/wiring/createStore";

export default function RootLayout() {
	const store = useMemo(() => createWlStore(), []);

	return (
		<Provider store={store}>
			<AppBootstrap />
			<RootNavigator />
		</Provider>
	);
}
