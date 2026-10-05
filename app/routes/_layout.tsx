import { useMemo } from "react";
import { View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
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
			<View style={{ flex: 1, backgroundColor: palette.background }}>
				<AppBootstrap />
				<RootNavigator />
			</View>
		</Provider>
	);
}

export default withCrashReporting(RootLayout);
