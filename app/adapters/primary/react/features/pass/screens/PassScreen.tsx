import { useNavigation } from "@react-navigation/native";
import { SymbolView } from "expo-symbols";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { PassAvatar } from "@/app/adapters/primary/react/features/pass/components/PassAvatar";
import { ScanTicketFab } from "@/app/adapters/primary/react/features/scan/components/ScanTicketFab";
import { PassRequirementViewModel, PassRingViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";

export function PassScreen() {
	const navigation = useNavigation<any>();
	const inset = useSafeAreaInsets();
	const vm = usePassRingsViewModel();

	const onPrimaryAction = useCallback(() => {
		navigation.navigate("ScanTicketModal");
	}, [navigation]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				contentContainerStyle={styles.container}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.summary}>
					<View style={styles.hero}>
						<PassAvatar
							imageUrl={vm.profileImageUrl}
							rings={vm.rings}
							size={108}
							accessibilityLabel={vm.accessibilityLabel}
						/>
					</View>

					<View style={styles.currentBlock}>
						<Text style={styles.levelEyebrow}>Niveau actuel</Text>
						<Text style={styles.levelTitle}>{vm.currentLevel.label}</Text>
						<Text style={styles.progressText}>{vm.currentLevel.progressPercent} %</Text>
					</View>
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Objectifs</Text>
					{vm.currentLevel.requirements.length ? (
						<View style={styles.requirements}>
							{vm.currentLevel.requirements.map((requirement) => (
								<RequirementRow key={requirement.key} requirement={requirement} />
							))}
						</View>
					) : (
						<Text style={styles.finalText}>Niveau final libre. Aucun nouvel objectif imposé.</Text>
					)}
				</View>

				{vm.nextUnlock ? (
					<View style={styles.unlockBand}>
						<View>
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

				<View style={styles.fabClearance} />
			</ScrollView>

			<ScanTicketFab onPress={onPrimaryAction} insetBottom={inset.bottom} />
		</SafeAreaView>
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

function LevelDot({ ring }: { ring: PassRingViewModel }) {
	const color = ring.status === "completed" ? ring.completedColor : ring.status === "inProgress" ? ring.progressColor : palette.border_70;
	return (
		<View style={styles.levelDotItem} accessibilityLabel={`${ring.label}, ${ring.status}`}>
			<View style={[styles.levelDot, { borderColor: color }]}>
				<View style={[styles.levelDotFill, { backgroundColor: ring.status === "locked" ? palette.border_30 : color }]} />
			</View>
			<Text style={[styles.levelDotLabel, ring.status === "locked" && styles.lockedLabel]} numberOfLines={1}>
				{ring.label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: palette.background },
	container: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 10,
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
		color: palette.textMuted,
		fontSize: 11,
		fontWeight: "800",
		textTransform: "uppercase",
	},
	levelTitle: {
		marginTop: 4,
		color: palette.textPrimary,
		fontSize: 24,
		fontWeight: "800",
		textAlign: "left",
	},
	progressText: {
		marginTop: 4,
		color: palette.accent,
		fontSize: 14,
		fontWeight: "800",
	},
	panel: {
		width: "100%",
		marginTop: 18,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: palette.border,
		paddingVertical: 14,
	},
	panelTitle: {
		color: palette.textPrimary,
		fontSize: 14,
		fontWeight: "800",
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
		color: palette.textMuted,
		fontSize: 11,
		fontWeight: "600",
	},
	requirementValue: {
		color: palette.textSecondary,
		fontSize: 14,
		fontWeight: "800",
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
		borderWidth: 1,
		borderColor: palette.accent_30,
		backgroundColor: palette.accentSoft,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	unlockLabel: {
		color: palette.textMuted,
		fontSize: 11,
		fontWeight: "800",
		textTransform: "uppercase",
	},
	unlockValue: {
		marginTop: 2,
		color: palette.textPrimary,
		fontSize: 16,
		fontWeight: "800",
	},
	levelStrip: {
		width: "100%",
		marginTop: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 8,
	},
	levelDotItem: {
		flex: 1,
		alignItems: "center",
		minWidth: 0,
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
		fontSize: 10,
		fontWeight: "700",
		textAlign: "center",
	},
	lockedLabel: {
		color: palette.textMuted,
	},
	fabClearance: {
		height: 32,
	},
});

export default PassScreen;
