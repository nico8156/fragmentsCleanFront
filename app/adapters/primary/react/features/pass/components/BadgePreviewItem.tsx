import { palette } from "@/app/adapters/primary/react/css/colors";
import { DecoratedBadge } from "@/app/adapters/secondary/viewModel/useRewardsVM";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BADGE_ICONS: Record<string, string> = {
	urban_explorer: "🧭",
	coffee_taster: "☕️",
	social_bean: "🤝",
	fragments_master: "🏆",
};

type Props = {
	badge: DecoratedBadge;
	onPress: () => void;
};

export function BadgePreviewItem({ badge, onPress }: Props) {
	const progressPercent = useMemo(() => Math.round(badge.completion * 100), [badge.completion]);

	const pill = useMemo(() => {
		if (badge.status === "unlocked") return { text: "Débloqué", style: styles.pillUnlocked };
		if (badge.status === "in_progress") return { text: "En cours", style: styles.pillInProgress };
		return { text: "Verrouillé", style: styles.pillLocked };
	}, [badge.status]);

	const foot =
		badge.status === "unlocked"
			? "Badge débloqué 🎉"
			: `Encore ${badge.remainingSteps} action(s)`;

	return (
		<TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
			<View style={styles.rowTop}>
				<Text style={styles.icon}>{BADGE_ICONS[badge.id] ?? "🎖️"}</Text>
				<View style={{ flex: 1 }}>
					<Text style={styles.title}>{badge.label}</Text>
					<Text style={styles.subtitle}>{foot}</Text>
				</View>
				<Text style={[styles.pill, pill.style]}>{pill.text}</Text>
			</View>

			<View style={styles.rowProgress}>
				<Text style={styles.progressText}>
					{badge.currentSteps}/{badge.totalRequired}
				</Text>
				<Text style={styles.progressTextMuted}>{progressPercent}%</Text>
			</View>

			<View style={styles.progressBarBg}>
				<View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
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

