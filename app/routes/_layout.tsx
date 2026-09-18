import { useMemo } from "react";
import { Provider } from "react-redux";

import { AppBootstrap } from "@/app/adapters/primary/react/AppBootstrap";
import { RootNavigator } from "@/app/adapters/primary/react/navigation/RootNavigator";
import { createWlStore } from "@/app/adapters/primary/wiring/createStore";
import {
	initializeCrashReporting,
	withCrashReporting,
} from "@/app/adapters/secondary/gateways/observability/sentryCrashReporter";

initializeCrashReporting();

function RootLayout() {
	const store = useMemo(() => createWlStore(), []);

	return (
		<Provider store={store}>
			<AppBootstrap />
			<RootNavigator />
		</Provider>
	);
}

export default withCrashReporting(RootLayout);
