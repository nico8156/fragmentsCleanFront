import { SectionHeader } from "@/app/adapters/primary/react/components/design/Primitives";
import { spacing } from "@/app/adapters/primary/react/css/designTokens";
import React from "react";
import { StyleSheet, View } from "react-native";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return <View style={s.section}>
		<SectionHeader title={title} />
		<View style={s.content}>{children}</View>
	</View>;
}
const s = StyleSheet.create({
	section: { paddingHorizontal: spacing.standard, paddingTop: spacing.section, gap: spacing.compact },
	content: { gap: spacing.micro },
});
