import { palette } from "@/app/adapters/primary/react/css/colors";
import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: palette.background_1 },
	screen: { flex: 1, backgroundColor: palette.background_1 },
	content: { paddingBottom: 20 },

	bottomBar: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 12,
		paddingBottom: Platform.OS === "ios" ? 18 : 12,
		paddingTop: 10,
		backgroundColor: palette.background_1,
		borderTopWidth: 1,
		borderTopColor: palette.border,
	},
	bottomBarInner: {
		flexDirection: "row",
		alignItems: "stretch",
		justifyContent: "flex-start",
		// IMPORTANT: pas de wrap, pas de gap
	},

});
