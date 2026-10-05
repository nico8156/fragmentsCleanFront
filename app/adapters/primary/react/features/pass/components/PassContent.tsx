import { RootScreenTitle } from "@/app/adapters/primary/react/components/design/RootScreenTitle";
import { SymbolView } from "expo-symbols";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { PassAvatar } from "@/app/adapters/primary/react/features/pass/components/PassAvatar";
import type { PassRequirementViewModel, PassRingViewModel, PassViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";

export function PassContent({ vm }: { vm: PassViewModel }) {

	return (
		<View style={styles.container}>
			<RootScreenTitle>{vm.title}</RootScreenTitle>
			<Text style={styles.intro}>Retrouve tes niveaux et les objectifs de ton Pass.</Text>
			<View style={styles.summary}>
				<View style={styles.hero}>
					<PassAvatar
						imageUrl={vm.profileImageUrl}
						rings={vm.displayRings}
						size={96}
						accessibilityLabel={vm.accessibilityLabel}
					/>
				</View>

				<View style={styles.currentBlock}>
					<Text style={styles.levelEyebrow}>Niveau actuel</Text>
					<Text accessibilityRole="header" style={styles.levelTitle}>{vm.currentLevel.label}</Text>
					<Text style={styles.progressText}>{vm.currentLevel.progressPercent} %</Text>
				</View>
			</View>

			<View style={styles.panel}>
				<Text accessibilityRole="header" style={styles.panelTitle}>Objectifs</Text>
				{vm.currentLevel.requirements.length ? (
					<View style={styles.requirements}>
						{vm.currentLevel.requirements.map((requirement) => (
							<RequirementRow key={requirement.key} requirement={requirement} />
						))}
					</View>
				) : (
					<Text style={styles.finalText}>
						{vm.currentLevel.status === "completed"
							? "Niveau atteint."
							: "Progression en attente de synchronisation."}
					</Text>
				)}
			</View>

			{vm.nextUnlock ? (
				<View style={styles.unlockBand}>
					<View style={{ flex: 1 }}>
						<Text style={styles.unlockLabel}>Débloque</Text>
						<Text style={styles.unlockValue}>{vm.nextUnlock.label}</Text>
					</View>
					<SymbolView name="lock.open" size={20} tintColor={palette.accent} />
				</View>
			) : null}

			<View style={styles.levelStrip}>
				{vm.rings.map((ring) => (
					<LevelDot key={ring.level} ring={ring} />
				))}
			</View>
		</View>
	);
}

function RequirementRow({ requirement }: { requirement: PassRequirementViewModel }) {
	const value = `${Math.min(requirement.current, requirement.required)} / ${requirement.required}`;
	return (
		<View style={styles.requirementRow}>
			<View style={[styles.check, requirement.completed && styles.checkCompleted]}>
				{requirement.completed ? (
					<SymbolView name="checkmark" size={13} tintColor={palette.background} />
				) : null}
			</View>
			<View style={styles.requirementTextBlock}>
				<Text style={styles.requirementLabel}>{requirement.label}</Text>
				{requirement.remaining > 0 ? (
					<Text style={styles.requirementHint}>Encore {requirement.remaining}</Text>
				) : (
					<Text style={styles.requirementHint}>Terminé</Text>
				)}
			</View>
			<Text style={styles.requirementValue}>{value}</Text>
		</View>
	);
}

const statusLabels = { completed: "Atteint", inProgress: "En cours", locked: "Verrouillé" };

function LevelDot({ ring }: { ring: PassRingViewModel }) {
	const color = ring.status === "completed" ? ring.completedColor : ring.status === "inProgress" ? ring.progressColor : palette.border_70;
	return (
		<View style={styles.levelDotItem} accessible accessibilityLabel={`${ring.label}, ${statusLabels[ring.status]}`}>
			<View style={[styles.levelDot, { borderColor: color }]}>
				<View style={[styles.levelDotFill, { backgroundColor: ring.status === "locked" ? palette.border_30 : color }]} />
			</View>
			<Text style={[styles.levelDotLabel, ring.status === "locked" && styles.lockedLabel]}>
				{ring.label}
			</Text>
			<Text style={styles.levelDotLabel}>{statusLabels[ring.status]}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	intro: { fontSize: 14, lineHeight: 20, color: palette.textSecondary, alignSelf: "stretch", marginTop: 8, marginBottom: 24 },
	container: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 16,
		alignItems: "center",
	},
	summary: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 18,
	},
	hero: {
		alignItems: "center",
		justifyContent: "center",
	},
	currentBlock: {
		flex: 1,
		alignItems: "flex-start",
		minWidth: 0,
	},
	levelEyebrow: {
		color: palette.textSecondary,
		fontSize: 14,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	levelTitle: {
		marginTop: 4,
		color: palette.textPrimary,
		fontSize: 24,
		fontWeight: "600",
		textAlign: "left",
	},
	progressText: {
		marginTop: 4,
		color: palette.accent,
		fontSize: 14,
		fontWeight: "600",
	},
	panel: {
		width: "100%",
		marginTop: 18,
		paddingVertical: 14,
	},
	panelTitle: {
		color: palette.textPrimary,
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 10,
	},
	requirements: {
		gap: 8,
	},
	requirementRow: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 38,
	},
	check: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1,
		borderColor: palette.border_70,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	checkCompleted: {
		backgroundColor: palette.success,
		borderColor: palette.success,
	},
	requirementTextBlock: {
		flex: 1,
		minWidth: 0,
	},
	requirementLabel: {
		color: palette.textPrimary,
		fontSize: 14,
		fontWeight: "700",
	},
	requirementHint: {
		color: palette.textSecondary,
		fontSize: 14,
		fontWeight: "600",
	},
	requirementValue: {
		color: palette.textSecondary,
		fontSize: 14,
		fontWeight: "600",
		marginLeft: 10,
	},
	finalText: {
		color: palette.textSecondary,
		fontSize: 14,
		lineHeight: 19,
	},
	unlockBand: {
		width: "100%",
		marginTop: 12,
		paddingVertical: 11,
		paddingHorizontal: 14,
		borderRadius: 8,
		backgroundColor: palette.accentSoft,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	unlockLabel: {
		color: palette.textSecondary,
		fontSize: 14,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	unlockValue: {
		marginTop: 2,
		color: palette.textPrimary,
		fontSize: 16,
		fontWeight: "600",
	},
	levelStrip: {
		width: "100%",
		marginTop: 16,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 16,
	},
	levelDotItem: {
		width: "45%",
		alignItems: "center",
	},
	levelDot: {
		width: 18,
		height: 18,
		borderRadius: 9,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	levelDotFill: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	levelDotLabel: {
		marginTop: 5,
		color: palette.textSecondary,
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
	},
	lockedLabel: {
		color: palette.textSecondary,
	},
});
