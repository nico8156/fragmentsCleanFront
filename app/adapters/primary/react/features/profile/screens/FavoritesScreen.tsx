import { StyleSheet, Text, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";

const MOCK_FAVORITES = [
	{ id: "fav-1", name: "Fragments République", description: "Paris 11e" },
	{ id: "fav-2", name: "Fragments Pigalle", description: "Paris 09e" },
];

export function FavoritesScreen() {
	const { displayName, primaryEmail, avatarUrl } = useAuthUser();

	const isEmpty = MOCK_FAVORITES.length === 0;

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
				{isEmpty ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyTitle}>Aucun favori</Text>
						<Text style={styles.emptySubtitle}>
							Ajoute des cafés en favoris depuis leur fiche pour les retrouver
							facilement ici.
						</Text>
					</View>
				) : (
					<View style={styles.list}>
						{MOCK_FAVORITES.map((favorite) => (
							<View key={favorite.id} style={styles.favoriteCard}>
								<Text style={styles.favoriteName}>{favorite.name}</Text>
								<Text style={styles.favoriteDescription}>
									{favorite.description}
								</Text>
							</View>
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
		borderRadius: 14,
		padding: 14,
		backgroundColor: palette.bg_dark_10,
		borderWidth: 1,
		borderColor: palette.border,
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
});

export default FavoritesScreen;
