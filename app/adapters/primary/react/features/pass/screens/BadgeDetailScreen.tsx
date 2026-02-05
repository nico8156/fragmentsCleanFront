// BadgeDetailScreen.tsx
import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackParamList } from "@/app/adapters/primary/react/navigation/types";
import { useRewardsViewModel } from "@/app/adapters/secondary/viewModel/useRewardsVM";

type BadgeDetailRoute = RouteProp<RootStackParamList, "BadgeDetail">;

const BADGE_ICONS: Record<string, string> = {
	urban_explorer: "🧭",
	coffee_taster: "☕️",
	social_bean: "🤝",
	fragments_master: "🏆",
};

export function BadgeDetailScreen() {
	const route = useRoute<BadgeDetailRoute>();
	const { badgeId } = route.params;

	const { badgesById, progress, confirmedTickets, commentCount, likeCount, visitedCafesCount } =
		useRewardsViewModel();

	const badge = badgesById[badgeId];

	const progressPercent = useMemo(
		() => Math.round((badge.completion ?? 0) * 100),
		[badge.completion]
	);

	if (!badge) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<Text style={styles.error}>Badge introuvable.</Text>
			</SafeAreaView>
		);
	}

	const statusText =
		badge.status === "unlocked"
			? "Débloqué"
			: badge.status === "in_progress"
				? "En cours"
				: "Verrouillé";

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.icon}>{BADGE_ICONS[badge.id] ?? "🎖️"}</Text>

					<Text style={styles.title}>{badge.label}</Text>
					<Text style={styles.description}>{badge.description}</Text>

					<Text style={styles.status}>{statusText}</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Progression</Text>

					<View style={styles.progressRow}>
						<Text style={styles.progressText}>
							{badge.currentSteps} / {badge.totalRequired}
						</Text>
						<Text style={styles.progressPercent}>{progressPercent}%</Text>
					</View>

					<View style={styles.progressBarBg}>
						<View
							style={[
								styles.progressBarFill,
								{ width: `${progressPercent}%` },
							]}
						/>
					</View>

					{badge.status !== "unlocked" && (
						<Text style={styles.remaining}>
							Encore {badge.remainingSteps} action(s)
						</Text>
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Détail des critères</Text>

					<View style={styles.axisRow}>
						<Text style={styles.axisLabel}>🔍 Exploration</Text>
						<Text style={styles.axisValue}>
							{Math.min(progress.exploration, badge.requirements.exploration)} /{" "}
							{badge.requirements.exploration}
						</Text>
					</View>

					<View style={styles.axisRow}>
						<Text style={styles.axisLabel}>☕️ Goût</Text>
						<Text style={styles.axisValue}>
							{Math.min(progress.gout, badge.requirements.gout)} /{" "}
							{badge.requirements.gout}
						</Text>
					</View>

					<View style={styles.axisRow}>
						<Text style={styles.axisLabel}>💬 Social</Text>
						<Text style={styles.axisValue}>
							{Math.min(progress.social, badge.requirements.social)} /{" "}
							{badge.requirements.social}
						</Text>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Sources de progression</Text>

					<Text style={styles.sourceLine}>
						🔍 {visitedCafesCount} cafés croisés
					</Text>

					<Text style={styles.sourceLine}>
						☕️ {confirmedTickets} tickets confirmés
					</Text>

					<Text style={styles.sourceLine}>
						💬 {commentCount} commentaires · ❤️ {likeCount} likes
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: palette.background },

	container: {
		padding: 20,
		gap: 16,
	},

	header: {
		alignItems: "center",
		gap: 8,
	},

	icon: { fontSize: 50 },

	title: {
		fontSize: 22,
		fontWeight: "900",
		color: palette.textPrimary,
	},

	description: {
		textAlign: "center",
		color: palette.textSecondary,
		fontSize: 14,
		lineHeight: 20,
	},

	status: {
		marginTop: 4,
		fontSize: 13,
		fontWeight: "700",
		color: palette.accent,
	},

	card: {
		backgroundColor: palette.elevated,
		borderRadius: 18,
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.border,
		gap: 10,
	},

	sectionTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: palette.textPrimary,
	},

	progressRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},

	progressText: {
		fontSize: 13,
		color: palette.textPrimary,
	},

	progressPercent: {
		fontSize: 13,
		color: palette.textMuted,
	},

	progressBarBg: {
		height: 8,
		borderRadius: 999,
		backgroundColor: palette.overlay,
		overflow: "hidden",
	},

	progressBarFill: {
		height: "100%",
		backgroundColor: palette.accent,
	},

	remaining: {
		fontSize: 12,
		color: palette.textMuted,
	},

	axisRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},

	axisLabel: {
		fontSize: 13,
		color: palette.textSecondary,
	},

	axisValue: {
		fontSize: 13,
		color: palette.textPrimary,
		fontWeight: "700",
	},

	sourceLine: {
		fontSize: 12,
		color: palette.textSecondary,
	},

	error: {
		textAlign: "center",
		marginTop: 40,
		color: palette.textPrimary,
	},
});

export default BadgeDetailScreen;

