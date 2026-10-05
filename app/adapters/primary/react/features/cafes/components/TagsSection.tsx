import { palette } from "@/app/adapters/primary/react/css/colors";
import { filterPublicCoffeeTags } from "@/app/adapters/primary/react/features/cafes/coffeePresentation";
import { typography, spacing, radii } from "@/app/adapters/primary/react/css/designTokens";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Section } from "./Section";

export function TagsSection({ tags }: { tags: string[] }) {
	const publicTags = filterPublicCoffeeTags(tags);
	if (!publicTags.length) return null;

	return (
		<Section title="Caractéristiques">
			<View style={s.wrap}>
				{publicTags.map((t) => (
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
		paddingVertical: spacing.micro,
		borderRadius: radii.control,
		backgroundColor: palette.elevated,
	},
	tagText: { ...typography.body, color: palette.textPrimary },
});
