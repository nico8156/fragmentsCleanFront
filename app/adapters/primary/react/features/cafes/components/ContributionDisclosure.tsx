import React, { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";

// Keep the composer mounted so folding it never clears its draft or local photo.
export function ContributionDisclosure({ children }: { children: React.ReactNode }) {
	const [expanded, setExpanded] = useState(false);
	return <View>
		<Pressable accessibilityRole="button" accessibilityState={{ expanded }}
			onPress={() => { if (expanded) Keyboard.dismiss(); setExpanded(value => !value); }} style={s.toggle}>
			<Text style={s.label}>{expanded ? "Replier le formulaire" : "Raconter ma visite"}</Text>
			<Text style={s.label} accessible={false}>{expanded ? "−" : "+"}</Text>
		</Pressable>
		<View testID="experience-composer-content" style={!expanded && s.hidden}
			accessibilityElementsHidden={!expanded} importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}>
			{children}
		</View>
	</View>;
}
const s = StyleSheet.create({
	toggle: { minHeight: 44, paddingVertical: spacing.compact, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.compact },
	label: { ...typography.body, color: palette.accent, flexShrink: 1 },
	hidden: { display: "none" },
});
