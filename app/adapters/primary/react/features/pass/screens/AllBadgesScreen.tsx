// AllBadgesScreen.tsx
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";

import { BadgePreviewItem } from "@/app/adapters/primary/react/features/pass/components/BadgePreviewItem";

export function AllBadgesScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const { levels } = usePassRingsViewModel();

	return (
		<SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
			<FlatList
				data={levels}
				keyExtractor={(level) => level.level}
				contentContainerStyle={styles.container}
				renderItem={({ item }) => (
					<BadgePreviewItem
						badge={item}
						onPress={() =>
							navigation.navigate("BadgeDetail", { badgeId: item.level })
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
