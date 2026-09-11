import { palette } from "@/app/adapters/primary/react/css/colors";
import { PassLevelViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BADGE_ICONS: Record<string, string> = {
	URBAN_EXPLORER: "🧭",
	COFFEE_TASTER: "☕️",
	SOCIAL_BEAN: "🤝",
	FRAGMENTS_MASTER: "🏆",
};

type Props = {
	badge: PassLevelViewModel;
	onPress: () => void;
};

export function BadgePreviewItem({ badge, onPress }: Props) {
	const pill = (() => {
		if (badge.status === "completed") return { text: "Débloqué", style: styles.pillUnlocked };
		if (badge.status === "inProgress") return { text: "En cours", style: styles.pillInProgress };
		return { text: "Verrouillé", style: styles.pillLocked };
	})();
	const currentSteps = badge.requirements.reduce((sum, requirement) => sum + Math.min(requirement.current, requirement.required), 0);
	const totalRequired = badge.requirements.reduce((sum, requirement) => sum + requirement.required, 0);
	const remainingSteps = badge.requirements.reduce((sum, requirement) => sum + requirement.remaining, 0);

	const foot =
		badge.status === "completed"
			? "Niveau débloqué 🎉"
			: badge.requirements.length
				? `Encore ${remainingSteps} étape(s)`
				: "Progression en synchronisation";

	return (
		<TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
			<View style={styles.rowTop}>
				<Text style={styles.icon}>{BADGE_ICONS[badge.level] ?? "🎖️"}</Text>
				<View style={{ flex: 1 }}>
					<Text style={styles.title}>{badge.label}</Text>
					<Text style={styles.subtitle}>{foot}</Text>
				</View>
				<Text style={[styles.pill, pill.style]}>{pill.text}</Text>
			</View>

			<View style={styles.rowProgress}>
				<Text style={styles.progressText}>
					{currentSteps}/{totalRequired}
				</Text>
				<Text style={styles.progressTextMuted}>{badge.progressPercent}%</Text>
			</View>

			<View style={styles.progressBarBg}>
				<View style={[styles.progressBarFill, { width: `${badge.progressPercent}%` }]} />
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: palette.elevated,
		borderRadius: 18,
		padding: 14,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.border,
		gap: 10,
	},
	rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
	icon: { fontSize: 26 },
	title: { color: palette.textPrimary, fontSize: 14, fontWeight: "800" },
	subtitle: { color: palette.textMuted, fontSize: 12, marginTop: 2 },

	pill: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
		borderWidth: StyleSheet.hairlineWidth,
		fontSize: 11,
		overflow: "hidden",
		color: palette.textPrimary,
	},
	pillUnlocked: { backgroundColor: "rgba(79,178,142,0.16)", borderColor: palette.success },
	pillInProgress: { backgroundColor: "rgba(244,185,70,0.14)", borderColor: "#F4B946" },
	pillLocked: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: palette.border },

	rowProgress: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	progressText: { color: palette.textPrimary, fontSize: 12, fontWeight: "700" },
	progressTextMuted: { color: palette.textMuted, fontSize: 12 },

	progressBarBg: {
		height: 8,
		borderRadius: 999,
		backgroundColor: palette.overlay,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.border,
		overflow: "hidden",
	},
	progressBarFill: {
		height: "100%",
		backgroundColor: palette.accent,
	},
});
