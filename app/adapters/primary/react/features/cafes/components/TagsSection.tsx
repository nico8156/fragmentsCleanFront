import { palette } from "@/app/adapters/primary/react/css/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Section } from "./Section";

export function TagsSection({ tags }: { tags: string[] }) {
	if (!tags?.length) return null;

	return (
		<Section title="Tags">
			<View style={s.wrap}>
				{tags.map((t) => (
					<View key={t} style={s.tag}>
						<Text style={s.tagText}>{t}</Text>
					</View>
				))}
			</View>
		</Section>
	);
}

const s = StyleSheet.create({
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	tag: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
	},
	tagText: { fontSize: 14, fontWeight: "800", color: palette.textPrimary_1 },
});

