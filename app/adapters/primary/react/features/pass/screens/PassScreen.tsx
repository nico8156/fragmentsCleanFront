// PassScreen.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { ScanTicketFab } from "@/app/adapters/primary/react/features/scan/components/ScanTicketFab";

import { usePassHomeViewModel } from "@/app/adapters/secondary/viewModel/usePassHomeViewModel";
import { usePassToasts } from "@/app/adapters/secondary/viewModel/usePassToasts";

import { BadgePreviewItem } from "@/app/adapters/primary/react/features/pass/components/BadgePreviewItem";
import { NextGoalCard } from "@/app/adapters/primary/react/features/pass/components/NextGoalCard";

export function PassScreen() {
	const navigation = useNavigation<any>();
	const inset = useSafeAreaInsets();

	// minimal toast implementation
	usePassToasts((msg) => console.log("[TOAST]", msg));

	const vm = usePassHomeViewModel();

	const onPrimaryAction = useCallback(() => {
		navigation.navigate("ScanTicketModal");
	}, [navigation]);

	const onOpenBadge = useCallback(
		(badgeId: string) => {
			navigation.navigate("BadgeDetail", { badgeId });
		},
		[navigation]
	);

	const onOpenAllBadges = useCallback(() => {
		navigation.navigate("AllBadges");
	}, [navigation]);

	return (
		<SafeAreaView style={styles.safeArea} >
			<FlatList
				data={vm.badgesPreview}
				keyExtractor={(b) => b.id
				}
				contentContainerStyle={styles.container}
				ListHeaderComponent={
					< View style={styles.header} >
						<View style={styles.statusCard}>
							<Text style={styles.statusTitle}> Ton Pass </Text>
							< Text style={styles.statusLine} > {vm.statusLine} </Text>
						</View>

						{
							vm.nextGoal ? (
								<NextGoalCard
									title={vm.nextGoal.title}
									description={vm.nextGoal.description}
									progressLabel={vm.nextGoal.progressLabel}
									ctaLabel={vm.primaryAction.label}
									onPressCta={onPrimaryAction}
									onPressCard={() => onOpenBadge(vm.nextGoal!.badgeId)
									}
								/>
							) : (
								<NextGoalCard
									title="Continue à explorer"
									description="Scanne un ticket pour faire progresser ton Pass."
									progressLabel=""
									ctaLabel={vm.primaryAction.label}
									onPressCta={onPrimaryAction}
								/>
							)}

						<View style={styles.sectionHeaderRow}>
							<Text style={styles.sectionTitle}> Badges </Text>
							< TouchableOpacity
								onPress={onOpenAllBadges}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<Text style={styles.sectionCta}> Voir tout </Text>
							</TouchableOpacity>
						</View>
					</View>
				}
				renderItem={({ item }) => (
					<BadgePreviewItem badge={item} onPress={() => onOpenBadge(item.id)} />
				)}
				ListFooterComponent={< View style={{ height: 140 }} />}
			/>

			< ScanTicketFab onPress={onPrimaryAction} insetBottom={inset.bottom} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: palette.background },
	container: {
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 40,
		gap: 12,
	},
	header: { gap: 12 },
	statusCard: {
		backgroundColor: palette.elevated,
		borderRadius: 20,
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.border,
		gap: 6,
	},
	statusTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: palette.textPrimary,
	},
	statusLine: {
		fontSize: 13,
		lineHeight: 18,
		color: palette.textSecondary,
	},
	sectionHeaderRow: {
		marginTop: 6,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: palette.textPrimary,
	},
	sectionCta: {
		fontSize: 13,
		fontWeight: "700",
		color: palette.accent,
	},
});

export default PassScreen;

