import type { ReactNode } from "react";
import {
	ActivityIndicator, Pressable, StyleSheet, Text, View,
	type StyleProp, type ViewStyle,
} from "react-native";
import { palette } from "../../css/colors";
import { floatingControl, radii, spacing, surfaces, typography } from "../../css/designTokens";

type ButtonProps = {
	label: string;
	onPress: () => void;
	variant?: "primary" | "secondary" | "tertiary" | "danger";
	tone?: "dark" | "light";
	disabled?: boolean;
	accessibilityLabel?: string;
	style?: StyleProp<ViewStyle>;
};

export function FragmentsButton({
	label, onPress, variant = "primary", tone = "dark", disabled = false, accessibilityLabel, style,
}: ButtonProps) {
	const light = tone === "light";
	const backgroundColor = variant === "primary" ? palette.accent
		: variant === "secondary" ? (light ? surfaces.previewTonal : surfaces.tonal) : "transparent";
	const color = variant === "primary" ? palette.background
		: variant === "danger" ? (light ? surfaces.previewDanger : palette.danger)
		: variant === "tertiary" ? (light ? palette.accentMuted : palette.accent)
		: light ? surfaces.previewText : palette.textPrimary;
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? label}
			accessibilityState={{ disabled }}
			style={({ pressed }) => [styles.button, { backgroundColor }, style, disabled ? styles.disabled : pressed && styles.pressed]}
		>
			<Text style={[typography.body, styles.buttonLabel, { color }]}>{label}</Text>
		</Pressable>
	);
}

export function FloatingIconButton({ accessibilityLabel, onPress, children, selected, compact = false }: {
	accessibilityLabel: string; onPress: () => void; children: ReactNode; selected?: boolean; compact?: boolean;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={selected === undefined ? undefined : { selected }}
			style={({ pressed }) => [floatingControl, compact && styles.compactIcon, pressed && styles.pressed]}
		>
			{children}
		</Pressable>
	);
}

export function CompactCard({ children, onPress, style }: {
	children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>;
}) {
	return onPress ? (
		<Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
			{children}
		</Pressable>
	) : <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onAction }: {
	title: string; action?: string; onAction?: () => void;
}) {
	return (
		<View style={styles.header}>
			<Text accessibilityRole="header" style={[typography.section, styles.title]}>{title}</Text>
			{action && onAction ? <FragmentsButton label={action} onPress={onAction} variant="tertiary" style={styles.headerAction} /> : null}
		</View>
	);
}

// Callers supply read-model status and copy; this component owns no retry/cache policy.
export function ContentState({ kind, title, message, action, onAction, tone = "dark" }: {
	kind: "empty" | "loading" | "error" | "offline" | "stale" | "notice";
	title?: string;
	message: string;
	action?: string;
	onAction?: () => void;
	tone?: "dark" | "light";
}) {
	const color = tone === "light" ? surfaces.previewSecondary : palette.textSecondary;
	return (
		<View accessibilityLiveRegion="polite" accessibilityRole={kind === "error" ? "alert" : undefined} style={styles.state}>
			{title ? <Text style={[typography.card, { color }]}>{title}</Text> : null}
			<View style={styles.stateCopy}>
				{kind === "loading" ? <ActivityIndicator color={color} /> : null}
				<Text style={[typography.body, styles.stateMessage, { color }]}>{message}</Text>
			</View>
			{action && onAction ? <FragmentsButton label={action} onPress={onAction} variant="tertiary" tone={tone} style={styles.stateAction} /> : null}
		</View>
	);
}

export const compactSheetPresentation = {
	backgroundColor: surfaces.preview,
	borderTopLeftRadius: radii.sheet,
	borderTopRightRadius: radii.sheet,
};

const styles = StyleSheet.create({
	button: { minHeight: 44, paddingHorizontal: spacing.standard, paddingVertical: spacing.compact, borderRadius: radii.control, justifyContent: "center" },
	compactIcon: { width: 44, height: 44 },
	buttonLabel: { fontWeight: "600", textAlign: "center" },
	pressed: { opacity: 0.75 },
	disabled: { opacity: 0.45 },
	card: { backgroundColor: surfaces.card, borderRadius: radii.card, padding: spacing.standard },
	header: { flexDirection: "row", alignItems: "center", gap: spacing.compact },
	title: { flex: 1, minWidth: 0, color: palette.textPrimary },
	headerAction: { flexShrink: 0, maxWidth: "45%", paddingHorizontal: 0 },
	state: { gap: spacing.micro, paddingVertical: spacing.compact },
	stateCopy: { flexDirection: "row", alignItems: "center", gap: spacing.micro },
	stateMessage: { flexShrink: 1 },
	stateAction: { alignSelf: "flex-start", paddingHorizontal: 0 },
});
