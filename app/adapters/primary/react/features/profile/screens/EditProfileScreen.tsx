import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { typography } from "@/app/adapters/primary/react/css/designTokens";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { pickDurableImage } from "@/app/adapters/secondary/gateways/media/pickDurableImage";

export function EditProfileScreen() {
	const {
		displayName,
		avatarUrl,
		profileMutationStatus,
		profileMutationError,
		updateDisplayName,
		replaceAvatar,
		removeAvatar,
	} = useAuthUser();
	const [imageError, setImageError] = useState<string>();
	const [preparingAvatar, setPreparingAvatar] = useState(false);

	const safeDisplayName = displayName ?? "Profil";
	const [draftName, setDraftName] = useState(safeDisplayName);
	useEffect(() => setDraftName(safeDisplayName), [safeDisplayName]);
	const pending = profileMutationStatus === "pending";
	const imagePermissionDenied = imageError?.startsWith("Autorise ") ?? false;
	const unchanged = draftName.trim().replace(/\s+/g, " ") === displayName;
	const chooseAvatar = () => Alert.alert("Photo de profil", "Choisis une source", [
		{ text: "Annuler", style: "cancel" },
		{ text: "Photothèque", onPress: () => void selectAvatar("library") },
		{ text: "Appareil photo", onPress: () => void selectAvatar("camera") },
	]);
	const selectAvatar = async (source: "library" | "camera") => {
		try {
			setPreparingAvatar(true);
			setImageError(undefined);
			const image = await pickDurableImage(source);
			if (image) replaceAvatar({ image });
		} catch (error) {
			setImageError(error instanceof Error ? error.message : "Impossible de préparer cette image.");
		} finally {
			setPreparingAvatar(false);
		}
	};

	return (
		<ProfileLayout>
			<ProfileHero avatarUrl={avatarUrl} displayName={safeDisplayName} />
			<ProfileCard title="Photo de profil" subtitle="Choisis une image : elle sera recadrée et optimisée avant l’envoi.">
				<Pressable
					testID="replace-avatar"
					disabled={preparingAvatar}
					accessibilityRole="button"
					accessibilityState={{ disabled: preparingAvatar, busy: preparingAvatar }}
					onPress={chooseAvatar}
					style={({ pressed }) => [styles.saveButton, preparingAvatar && styles.saveButtonDisabled, pressed && styles.pressed]}
				>
					<Text style={styles.saveText}>{preparingAvatar ? "Préparation…" : avatarUrl ? "Remplacer la photo" : "Ajouter une photo"}</Text>
				</Pressable>
				{avatarUrl ? (
					<Pressable testID="remove-avatar" style={styles.textAction} disabled={preparingAvatar} onPress={removeAvatar} accessibilityRole="button" accessibilityState={{ disabled: preparingAvatar }}>
						<Text style={styles.removeText}>Supprimer la photo</Text>
					</Pressable>
				) : null}
				{imageError ? <Text accessibilityRole="alert" style={styles.error}>{imageError}</Text> : null}
				{imagePermissionDenied ? (
					<Pressable style={styles.textAction} accessibilityRole="button" onPress={() => void Linking.openSettings()}>
						<Text style={styles.settingsLink}>Ouvrir les réglages</Text>
					</Pressable>
				) : null}
				{pending && avatarUrl?.startsWith("file:") ? (
					<Text accessibilityLiveRegion="polite" style={styles.helper}>Photo prête, synchronisation en cours…</Text>
				) : null}
			</ProfileCard>

			<ProfileCard
				title="Informations personnelles"
				subtitle="Choisis le nom public visible dans Fragments."
			>
				<View style={styles.field}>
					<Text style={styles.label}>Nom affiché</Text>
					<TextInput
						testID="display-name-input"
						value={draftName}
						onChangeText={setDraftName}
						editable={!pending}
						maxLength={50}
						autoCapitalize="words"
						returnKeyType="done"
						accessibilityLabel="Nom affiché"
						style={styles.input}
					/>
				</View>

				<Pressable
					testID="save-display-name"
					disabled={pending || unchanged}
					accessibilityRole="button"
					accessibilityState={{ disabled: pending || unchanged, busy: pending }}
					onPress={() => updateDisplayName(draftName)}
					style={({ pressed }) => [
						styles.saveButton,
						(pending || unchanged) && styles.saveButtonDisabled,
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.saveText}>{pending ? "Synchronisation…" : "Enregistrer"}</Text>
				</Pressable>

				{profileMutationError ? (
					<Text accessibilityRole="alert" style={styles.error}>{profileMutationError}</Text>
				) : null}
				{profileMutationStatus === "saved" ? (
					<Text accessibilityLiveRegion="polite" style={styles.success}>Profil mis à jour.</Text>
				) : null}

				<Text style={styles.helper}>
					La modification est conservée hors ligne et synchronisée automatiquement dès que possible.
				</Text>
			</ProfileCard>
		</ProfileLayout>
	);
}

const styles = StyleSheet.create({
	field: {
		gap: 8,
	},
	label: {
		color: palette.textSecondary,
		fontSize: 14,
	},
	input: {
		borderWidth: 1,
		borderColor: palette.border,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		color: palette.textPrimary,
		backgroundColor: palette.bg_dark_10,
	},
	textAction: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
	saveButton: {
		minHeight: 44,
		alignItems: "center",
		borderRadius: 12,
		backgroundColor: palette.accent,
		paddingVertical: 14,
	},
	saveButtonDisabled: {
		opacity: 0.45,
	},
	pressed: {
		opacity: 0.75,
	},
	saveText: {
		color: palette.background,
		...typography.body,
		fontWeight: "600",
	},
	error: {
		color: palette.danger,
	},
	success: {
		color: palette.textSecondary,
	},
	helper: {
		fontSize: 12,
		color: palette.textSecondary,
	},
	removeText: {
		color: palette.danger,
		fontWeight: "600",
		textAlign: "center",
	},
	settingsLink: {
		color: palette.textPrimary,
		fontWeight: "700",
		textAlign: "center",
		textDecorationLine: "underline",
	},
});

export default EditProfileScreen;
