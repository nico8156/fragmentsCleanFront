import { palette } from "@/app/adapters/primary/react/css/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<View style={s.section}>
			<Text style={s.title}>{title}</Text>
			<View style={s.card}>{children}</View>
		</View>
	);
}
const s = StyleSheet.create({
	section: {
		paddingHorizontal: 0,
		paddingTop: 10,
	},

	title: {
		fontSize: 17,
		fontWeight: "800",
		color: palette.textPrimary_1,
		marginBottom: 6,
		paddingHorizontal: 6,
	},

	card: {
		borderRadius: 16,
		backgroundColor: palette.surface,       // au lieu d’un rgba fixe
		padding: 8,
		gap: 8,
		borderWidth: 1,
		borderColor: palette.border_muted_30,   // cohérence avec CommentsSection
	},
});
