import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ExperiencePhoto } from "./ExperiencePhoto";
import { FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { radii, spacing, surfaces, typography } from "@/app/adapters/primary/react/css/designTokens";

// The parent owns the draft and delegates writes through its existing view model.
export function ExperienceComposer({ message, onChangeMessage, canSubmit, photoUri, photoError, onChoosePhoto, onRemovePhoto, onSaveDraft, onPublish }: {
	message: string; onChangeMessage: (value: string) => void; canSubmit: boolean;
	photoUri?: string; photoError?: string; onChoosePhoto: () => void; onRemovePhoto: () => void;
	onSaveDraft: () => void; onPublish: () => void;
}) {
	return <View style={s.root}>
		<Text style={s.label}>Ta visite</Text>
		<TextInput value={message} onChangeText={onChangeMessage} maxLength={4000} multiline textAlignVertical="top"
			placeholder="Le café, l’ambiance, un détail à partager…" placeholderTextColor={palette.textMuted}
			accessibilityLabel="Mon expérience" style={s.input} />
		{photoUri ? <View style={s.photo}>
			<View testID="composer-photo-preview" style={s.preview}>
				<ExperiencePhoto uri={photoUri} label="Photo sélectionnée pour mon expérience" />
			</View>
			<Text style={s.hint}>Photo prête à joindre</Text>
			<FragmentsButton label="Retirer la photo" variant="tertiary" onPress={onRemovePhoto} style={s.textAction} />
		</View> : <FragmentsButton label="Ajouter une photo" variant="secondary" onPress={onChoosePhoto} style={s.textAction} />}
		{photoError ? <Text accessibilityRole="alert" style={s.error}>{photoError}</Text> : null}
		<FragmentsButton label="Partager mon expérience" disabled={!canSubmit} onPress={onPublish} />
		<FragmentsButton label="Enregistrer en brouillon" variant="tertiary" disabled={!canSubmit} onPress={onSaveDraft} />
	</View>;
}
const s = StyleSheet.create({
	root: { gap: spacing.compact },
	label: { ...typography.card, color: palette.textPrimary },
	input: { ...typography.body, minHeight: 112, maxHeight: 192, borderWidth: 1, borderColor: palette.border, borderRadius: radii.control, padding: spacing.compact, color: palette.textPrimary, backgroundColor: surfaces.card },
	preview: { width: 144, maxWidth: "100%", alignSelf: "flex-start" },
	photo: { gap: spacing.micro },
	hint: { ...typography.body, color: palette.textSecondary },
	textAction: { alignSelf: "flex-start" },
	error: { ...typography.body, color: palette.danger },
});
