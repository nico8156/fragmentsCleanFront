import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";

import { palette } from "@/app/adapters/primary/react/css/colors";
import type { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { useSavedCoffees } from "@/app/adapters/secondary/viewModel/useSavedCoffees";

export function FavoritesScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const { displayName, primaryEmail, avatarUrl } = useAuthUser();
	const vm = useSavedCoffees();

	return (
		<ProfileLayout>
			<ProfileHero
				avatarUrl={avatarUrl}
				displayName={displayName}
				email={primaryEmail ?? "Non renseigné"}
			/>

			<ProfileCard
				title="Cafés enregistrés"
				subtitle="Retrouve rapidement tes adresses préférées"
			>
				{vm.isEmpty ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyTitle}>Aucun favori</Text>
						<Text style={styles.emptySubtitle}>
							Enregistre des cafés depuis leur fiche pour les retrouver
							facilement ici.
						</Text>
					</View>
				) : (
					<View style={styles.list}>
						{vm.items.map((favorite) => (
							<Pressable
								key={favorite.coffeeId}
								onPress={() => navigation.navigate("CafeDetails", { id: favorite.coffeeId })}
								style={({ pressed }) => [
									styles.favoriteCard,
									pressed && styles.pressed,
								]}
							>
								<Text style={styles.favoriteName} numberOfLines={1}>{favorite.name}</Text>
								<Text style={styles.favoriteDescription}>
									{[favorite.addressLine, favorite.postalCode, favorite.city].filter(Boolean).join(", ")}
								</Text>
							</Pressable>
						))}
					</View>
				)}
			</ProfileCard>
		</ProfileLayout>
	);
}

const styles = StyleSheet.create({
	emptyState: {
		gap: 12,
	},

	emptyTitle: {
		fontSize: 17,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	emptySubtitle: {
		fontSize: 14,
		color: palette.textSecondary,
		lineHeight: 20,
	},

	list: {
		gap: 12,
	},

	favoriteCard: {
		borderRadius: 12,
		padding: 14,
		backgroundColor: palette.bg_dark_10,
		borderWidth: 1,
		borderColor: palette.border,
		gap: 4,
	},

	favoriteName: {
		fontSize: 16,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	favoriteDescription: {
		fontSize: 14,
		color: palette.textSecondary,
	},

	pressed: {
		opacity: 0.75,
	},
});

export default FavoritesScreen;
