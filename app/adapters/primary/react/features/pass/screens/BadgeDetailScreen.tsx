// BadgeDetailScreen.tsx
import { RouteProp, useRoute } from "@react-navigation/native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackParamList } from "@/app/adapters/primary/react/navigation/types";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";

type BadgeDetailRoute = RouteProp<RootStackParamList, "BadgeDetail">;

const BADGE_ICONS: Record<string, string> = {
	URBAN_EXPLORER: "🧭",
	COFFEE_TASTER: "☕️",
	SOCIAL_BEAN: "🤝",
	FRAGMENTS_MASTER: "🏆",
};

export function BadgeDetailScreen() {
	const route = useRoute<BadgeDetailRoute>();
	const { badgeId } = route.params;

	const { levels, counters } = usePassRingsViewModel();
	const badge = levels.find((level) => level.level === badgeId);

	if (!badge) {
		return (
			<SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
				<Text style={styles.error}>Badge introuvable.</Text>
			</SafeAreaView>
		);
	}

	const statusText =
		badge.status === "completed"
			? "Débloqué"
			: badge.status === "inProgress"
				? "En cours"
				: "Verrouillé";

	return (
		<SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container}>
				<View style={styles.header}>
					<Text style={styles.icon}>{BADGE_ICONS[badge.level] ?? "🎖️"}</Text>

					<Text accessibilityRole="header" style={styles.title}>{badge.label}</Text>
					<Text style={styles.description}>Progression du Pass calculée et conservée par Fragments.</Text>

					<Text style={styles.status}>{statusText}</Text>
				</View>

				<View style={styles.card}>
					<Text accessibilityRole="header" style={styles.sectionTitle}>Progression</Text>

					<View style={styles.progressRow}>
						<Text style={styles.progressText}>
							{badge.progressPercent} %
						</Text>
						<Text style={styles.progressPercent}>{statusText}</Text>
					</View>

					<View style={styles.progressBarBg}>
						<View
							style={[
								styles.progressBarFill,
								{ width: `${badge.progressPercent}%` },
							]}
						/>
					</View>

					{badge.status !== "completed" && badge.requirements.length > 0 && (
						<Text style={styles.remaining}>
							Encore {badge.requirements.reduce((sum, requirement) => sum + requirement.remaining, 0)} étape(s)
						</Text>
					)}
				</View>

				<View style={styles.card}>
					<Text accessibilityRole="header" style={styles.sectionTitle}>Détail des critères</Text>

					{badge.requirements.map((requirement) => (
						<View key={requirement.key} style={styles.axisRow}>
							<Text style={styles.axisLabel}>{requirement.label}</Text>
							<Text style={styles.axisValue}>
								{Math.min(requirement.current, requirement.required)} / {requirement.required}
							</Text>
						</View>
					))}
					{badge.requirements.length === 0 ? (
						<Text style={styles.remaining}>Critères en attente de synchronisation.</Text>
					) : null}
				</View>

				<View style={styles.card}>
					<Text accessibilityRole="header" style={styles.sectionTitle}>Sources de progression</Text>

					<Text style={styles.sourceLine}>📝 {counters.experiences} expériences publiées</Text>
					<Text style={styles.sourceLine}>🔍 {counters.cafes} cafés découverts</Text>
					<Text style={styles.sourceLine}>🎟️ {counters.tickets} tickets validés</Text>
				</View>
			</ScrollView>
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
		fontWeight: "600",
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
		gap: 10,
	},

	sectionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	progressRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		justifyContent: "space-between",
	},

	progressText: {
		fontSize: 13,
		color: palette.textPrimary,
	},

	progressPercent: {
		fontSize: 13,
		color: palette.textSecondary,
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
		color: palette.textSecondary,
	},

	axisRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		justifyContent: "space-between",
	},

	axisLabel: {
		flex: 1,
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
