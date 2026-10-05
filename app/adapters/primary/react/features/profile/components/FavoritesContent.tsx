import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ProfileCard } from "./ProfileCard";
import { palette } from "@/app/adapters/primary/react/css/colors";
import type { useSavedCoffees } from "@/app/adapters/secondary/viewModel/useSavedCoffees";
import { savedCoffeeLoadingStates } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";

export function FavoritesContent({ vm, onOpenCoffee }: {
	vm: ReturnType<typeof useSavedCoffees>; onOpenCoffee: (id: string) => void;
}) {
	return (
			<ProfileCard
				title="Mes favoris"
				subtitle="Tes cafés préférés, disponibles aussi hors connexion."
			>
				{vm.error ? (
					<View style={styles.errorState}>
						<Text style={styles.errorText}>La mise à jour des favoris a échoué.</Text>
						<Pressable accessibilityRole="button" accessibilityLabel="Réessayer de charger les favoris" onPress={vm.refresh}>
							<Text style={styles.retryText}>Réessayer</Text>
						</Pressable>
					</View>
				) : null}

				{vm.loading === savedCoffeeLoadingStates.PENDING && vm.isEmpty ? (
					<View style={styles.loadingState}>
						<ActivityIndicator color={palette.textPrimary} />
						<Text style={styles.loadingText}>Chargement de tes favoris…</Text>
					</View>
				) : vm.isEmpty ? (
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
								accessibilityRole="button"
								accessibilityLabel={`Ouvrir la fiche de ${favorite.name}`}
								onPress={() => onOpenCoffee(favorite.coffeeId)}
								style={({ pressed }) => [
									styles.favoriteCard,
									pressed && styles.pressed,
								]}
							>
								<View style={styles.favoriteHeader}>
									<Text style={styles.favoriteName}>{favorite.name}</Text>
									{favorite.optimistic ? <Text accessibilityLiveRegion="polite" style={styles.syncing}>Mise à jour…</Text> : null}
								</View>
								<Text style={styles.favoriteDescription}>
									{[favorite.addressLine, favorite.postalCode, favorite.city].filter(Boolean).join(", ")}
								</Text>
							</Pressable>
						))}
					</View>
				)}
			</ProfileCard>
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

	loadingState: {
		alignItems: "flex-start",
		gap: 10,
		paddingVertical: 12,
	},

	loadingText: {
		fontSize: 14,
		color: palette.textSecondary,
	},

	errorState: {
		borderRadius: 12,
		padding: 12,
		backgroundColor: palette.bg_dark_10,
		gap: 6,
	},

	errorText: {
		fontSize: 14,
		color: palette.textSecondary,
	},

	retryText: {
		minHeight: 44,
		paddingVertical: 12,
		fontSize: 14,
		fontWeight: "700",
		color: palette.textPrimary,
	},

	favoriteCard: {
		minHeight: 44,
		borderRadius: 12,
		padding: 14,
		backgroundColor: palette.bg_dark_10,
		gap: 4,
	},

	favoriteHeader: {
		flexDirection: "column",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 8,
	},

	favoriteName: {
		fontSize: 16,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	syncing: {
		fontSize: 12,
		color: palette.textSecondary,
	},

	favoriteDescription: {
		fontSize: 14,
		color: palette.textSecondary,
	},

	pressed: {
		opacity: 0.75,
	},
});
