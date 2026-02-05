import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { useOnBoarding } from "@/app/adapters/secondary/viewModel/useOnBoarding";

export function AppSettingsScreen() {
	const { displayName, primaryEmail, avatarUrl, isSignedIn, signOut } =
		useAuthUser();

	const [notificationsEnabled, setNotificationsEnabled] = useState(true);

	const statusLabel = useMemo(
		() => (isSignedIn ? "Connecté" : "Hors connexion"),
		[isSignedIn]
	);

	const { markHasNOTCompletedOnboarding } = useOnBoarding();

	return (
		<ProfileLayout>
			<ProfileHero
				avatarUrl={avatarUrl}
				displayName={displayName}
				email={primaryEmail ?? "Non renseigné"}
			/>

			<ProfileCard title="Préférences">
				<View style={styles.row}>
					<View>
						<Text style={styles.rowTitle}>Notifications</Text>
						<Text style={styles.rowSubtitle}>
							Reste informé des nouvelles offres
						</Text>
					</View>

					<Switch
						value={notificationsEnabled}
						onValueChange={setNotificationsEnabled}
					/>
				</View>

				<View style={styles.row}>
					<View>
						<Text style={styles.rowTitle}>Statut</Text>
						<Text style={styles.rowSubtitle}>{statusLabel}</Text>
					</View>
				</View>
			</ProfileCard>

			<View style={styles.actions}>
				<Pressable
					onPress={markHasNOTCompletedOnboarding}
					style={({ pressed }) => [
						styles.actionButton,
						styles.onboardingButton,
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.actionText}>
						Revoir l’onboarding
					</Text>
				</Pressable>

				<Pressable
					onPress={signOut}
					style={({ pressed }) => [
						styles.actionButton,
						styles.logoutButton,
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.signOutText}>Se déconnecter</Text>

					<Text style={styles.logoutSubtitle}>
						Termine ta session en toute sécurité
					</Text>
				</Pressable>
			</View>
		</ProfileLayout>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: palette.border,
	},

	rowTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	rowSubtitle: {
		fontSize: 14,
		color: palette.textSecondary,
	},

	actions: {
		gap: 12,
	},

	actionButton: {
		padding: 16,
		borderRadius: 16,
		alignItems: "center",
		gap: 6,
	},

	onboardingButton: {
		backgroundColor: palette.secondary_30,
		borderWidth: 1,
		borderColor: palette.secondary_90,
	},

	logoutButton: {
		backgroundColor: palette.primary_30,
		borderWidth: 1,
		borderColor: palette.primary_50,
	},

	pressed: {
		opacity: 0.8,
	},

	actionText: {
		fontSize: 16,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	signOutText: {
		fontSize: 18,
		fontWeight: "700",
		color: palette.accent,
	},

	logoutSubtitle: {
		fontSize: 13,
		color: palette.textSecondary,
	},
});

export default AppSettingsScreen;

