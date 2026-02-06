import { palette } from "@/app/adapters/primary/react/css/colors";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function DetailsNavBar({
	title,
	onBack,
	onRefresh,
}: {
	title: string;
	onBack: () => void;
	onRefresh: () => void;
}) {
	return (
		<View style={s.nav}>
			<Pressable onPress={onBack} style={s.navBtn}>
				<SymbolView name="chevron.left" size={18} tintColor={palette.textPrimary_1} fallback={<Text>{"<"}</Text>} />
			</Pressable>

			<Text style={s.navTitle} numberOfLines={1}>
				{title}
			</Text>
			<View style={s.navBtn} />

		</View>
	);
}

const s = StyleSheet.create({
	nav: {
		height: 54,
		paddingHorizontal: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: palette.background_1,
	},
	navBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	navTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 24,
		fontWeight: "800",
		color: palette.textPrimary_1,
		paddingHorizontal: 10,
	},
});

