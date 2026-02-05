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
	section: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
	title: { fontSize: 20, fontWeight: "900", color: "#4CAF50" },
	card: {
		borderRadius: 18,
		backgroundColor: "rgba(0,0,0,0.03)",
		padding: 14,
		gap: 12,
	},
	text: { color: palette.textPrimary_1 },
});

