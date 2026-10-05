import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";

export function AccountActions({ isSignedIn, deleting, accountDeletionError, markHasNOTCompletedOnboarding, signOut, deleteAccount }: {
	isSignedIn: boolean; deleting: boolean; accountDeletionError?: string;
	markHasNOTCompletedOnboarding: () => void; signOut: () => void; deleteAccount: () => void;
}) {
	const confirmAccountDeletion = () => Alert.alert(
		"Supprimer définitivement le compte ?",
		"Ton profil, tes tickets, favoris et contenus partagés seront supprimés. La demande est irréversible et peut prendre quelques minutes à se propager.",
		[
			{ text: "Annuler", style: "cancel" },
			{ text: "Supprimer mon compte", style: "destructive", onPress: deleteAccount },
		],
	);

	return (
		<View style={styles.actions}>
			{accountDeletionError ? <Text accessibilityRole="alert" style={styles.error}>{accountDeletionError}</Text> : null}
			<Pressable
				accessibilityRole="button" accessibilityLabel="Revoir l’onboarding"
				onPress={markHasNOTCompletedOnboarding}
				style={({ pressed }) => [
					styles.actionButton,
					pressed && styles.pressed,
				]}
			>
				<Text style={styles.actionText}>
					Revoir l’onboarding
				</Text>
			</Pressable>

			<Pressable
				accessibilityRole="button" accessibilityLabel="Se déconnecter"
				onPress={signOut}
				style={({ pressed }) => [
					styles.actionButton,
					pressed && styles.pressed,
				]}
			>
				<Text style={styles.signOutText}>Se déconnecter</Text>

				<Text style={styles.logoutSubtitle}>
					Termine ta session en toute sécurité
				</Text>
			</Pressable>

			{isSignedIn ? (
				<Pressable
					testID="delete-account"
					accessibilityRole="button"
					accessibilityLabel="Supprimer mon compte"
					accessibilityState={{ disabled: deleting, busy: deleting }}
					onPress={confirmAccountDeletion}
					disabled={deleting}
					style={({ pressed }) => [
						styles.actionButton,
						styles.deleteButton,
						(pressed || deleting) && styles.pressed,
					]}
				>
					<Text style={styles.deleteText}>
						{deleting ? "Enregistrement de la demande…" : "Supprimer mon compte"}
					</Text>
					<Text style={styles.logoutSubtitle}>
						Supprime définitivement le compte et les données associées
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}
const styles = StyleSheet.create({
	actions: { gap: spacing.micro, paddingTop: spacing.standard },
	actionButton: { minHeight: 44, paddingVertical: spacing.compact, gap: 4 },
	deleteButton: { marginTop: spacing.standard },
	actionText: { ...typography.body, color: palette.textPrimary },
	signOutText: { ...typography.body, color: palette.textPrimary },
	deleteText: { ...typography.body, color: palette.danger },
	logoutSubtitle: { ...typography.body, color: palette.textSecondary },
	error: { ...typography.body, color: palette.danger },
	pressed: { opacity: 0.65 },
});
