// AllBadgesScreen.tsx
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { useRewardsViewModel } from "@/app/adapters/secondary/viewModel/useRewardsVM";

import { BadgePreviewItem } from "@/app/adapters/primary/react/features/pass/components/BadgePreviewItem";

export function AllBadgesScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const { badges } = useRewardsViewModel();

	return (
		<SafeAreaView style={styles.safeArea}>
			<FlatList
				data={badges}
				keyExtractor={(b) => b.id}
				contentContainerStyle={styles.container}
				renderItem={({ item }) => (
					<BadgePreviewItem
						badge={item}
						onPress={() =>
							navigation.navigate("BadgeDetail", { badgeId: item.id })
						}
					/>
				)}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: palette.background,
	},
	container: {
		padding: 16,
		gap: 12,
	},
});

export default AllBadgesScreen;

