import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";

// Presentation only: callers retain permissions, confirmation and command callbacks.
export function ExperienceActionsMenu({ children }: { children: React.ReactNode }) {
	const [expanded, setExpanded] = useState(false);
	return <View>
		<Pressable accessibilityRole="button" accessibilityLabel="Options de l’expérience"
			accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={s.trigger}>
			<Text style={s.label}>Options</Text><Text style={s.label} accessible={false}>{expanded ? "−" : "···"}</Text>
		</Pressable>
		{expanded ? <View style={s.actions}>{children}</View> : null}
	</View>;
}
const s = StyleSheet.create({
	trigger: { alignSelf: "flex-start", minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.micro },
	label: { ...typography.body, color: palette.textSecondary },
	actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.micro },
});
