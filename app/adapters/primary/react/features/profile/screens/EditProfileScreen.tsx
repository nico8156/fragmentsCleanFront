import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

	const safeDisplayName = displayName ?? "Profil";
	const [draftName, setDraftName] = useState(safeDisplayName);
	useEffect(() => setDraftName(safeDisplayName), [safeDisplayName]);
	const pending = profileMutationStatus === "pending";
	const unchanged = draftName.trim().replace(/\s+/g, " ") === displayName;
	const chooseAvatar = () => Alert.alert("Photo de profil", "Choisis une source", [
		{ text: "Annuler", style: "cancel" },
		{ text: "Photothèque", onPress: () => void selectAvatar("library") },
		{ text: "Appareil photo", onPress: () => void selectAvatar("camera") },
	]);
	const selectAvatar = async (source: "library" | "camera") => {
		try {
			setImageError(undefined);
			const image = await pickDurableImage(source);
			if (image) replaceAvatar({ image });
		} catch (error) {
			setImageError(error instanceof Error ? error.message : "Impossible de préparer cette image.");
		}
	};

	return (
		<ProfileLayout>
			<ProfileHero avatarUrl={avatarUrl} displayName={safeDisplayName} />
			<ProfileCard title="Photo de profil" subtitle="Une image carrée, JPEG ou PNG, jusqu’à 8 Mo.">
				<Pressable
					testID="replace-avatar"
					disabled={pending}
					onPress={chooseAvatar}
					style={({ pressed }) => [styles.saveButton, pending && styles.saveButtonDisabled, pressed && styles.pressed]}
				>
					<Text style={styles.saveText}>{avatarUrl ? "Remplacer la photo" : "Ajouter une photo"}</Text>
				</Pressable>
				{avatarUrl ? (
					<Pressable testID="remove-avatar" disabled={pending} onPress={removeAvatar}>
						<Text style={styles.removeText}>Supprimer la photo</Text>
					</Pressable>
				) : null}
				{imageError ? <Text accessibilityRole="alert" style={styles.error}>{imageError}</Text> : null}
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
						style={styles.input}
					/>
				</View>

				<Pressable
					testID="save-display-name"
					disabled={pending || unchanged}
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
	saveButton: {
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
		color: palette.primary_30,
		fontSize: 16,
		fontWeight: "700",
	},
	error: {
		color: "#ef4444",
	},
	success: {
		color: palette.textSecondary,
	},
	helper: {
		fontSize: 12,
		color: palette.textSecondary,
	},
	removeText: {
		color: "#ef4444",
		fontWeight: "600",
		textAlign: "center",
	},
});

export default EditProfileScreen;
