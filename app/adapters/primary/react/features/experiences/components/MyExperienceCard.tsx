import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { ExperiencePhoto } from "./ExperiencePhoto";
import { ExperienceActionsMenu } from "./ExperienceActionsMenu";
import { FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, radii, surfaces, typography } from "@/app/adapters/primary/react/css/designTokens";
import { buildMyExperienceCardViewModel } from "@/app/adapters/secondary/viewModel/myExperienceCardViewModel";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

type MineCardProps = {
	item: ExperienceEntity;
	coffeeName?: string;
	onUpdate: (value: string) => void;
	onPublish: () => void;
	onDelete: () => void;
	onAddPhoto: () => Promise<void>;
	onDeletePhoto: (mediaId: string) => void;
};

export function MyExperienceCard({ item, coffeeName, onUpdate, onPublish, onDelete, onAddPhoto, onDeletePhoto }: MineCardProps) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(item.message);
	const [mediaError, setMediaError] = useState<string>();
	const view = buildMyExperienceCardViewModel(item, coffeeName);
	const media = item.media?.[0];
	const confirmDelete = () => Alert.alert(
		"Supprimer cette expérience ?",
		"Cette action retirera aussi sa photo après synchronisation.",
		[
			{ text: "Annuler", style: "cancel" },
			{ text: "Supprimer", style: "destructive", onPress: onDelete },
		],
	);
	const confirmPhotoDelete = () => {
		if (!media) return;
		Alert.alert("Supprimer la photo ?", undefined, [
			{ text: "Annuler", style: "cancel" },
			{ text: "Supprimer", style: "destructive", onPress: () => onDeletePhoto(media.mediaId) },
		]);
	};

	return (
		<View style={s.card}>
			<View style={s.cardHeader}>
				<Text style={s.coffeeName}>{view.coffeeName}</Text>
				<View style={s.statusBadge}>
					<Text accessibilityLiveRegion="polite" style={s.statusText}>{view.statusLabel}</Text>
				</View>
			</View>

			{editing ? (
				<TextInput
					autoFocus
					textAlignVertical="top"
					value={draft}
					onChangeText={setDraft}
					multiline
					maxLength={4000}
					style={s.input}
					accessibilityLabel="Modifier mon expérience"
				/>
			) : <Text style={s.body}>{item.message}</Text>}

			{view.mediaUri ? (
				<View style={s.mediaBlock}>
					<ExperiencePhoto uri={view.mediaUri} mediaId={media?.mediaId} label="Photo de mon expérience" />
					{view.mediaPending ? <Text accessibilityLiveRegion="polite" style={s.muted}>Photo en attente de synchronisation…</Text> : null}
				</View>
			) : null}
			{mediaError ? <Text accessibilityRole="alert" style={s.errorText}>{mediaError}</Text> : null}

			<ExperienceActionsMenu>
				{view.mediaUri ? <ActionButton label="Supprimer la photo" danger onPress={confirmPhotoDelete} /> : (
					<ActionButton
						label="Ajouter une photo" quiet
						disabled={item.optimistic}
						onPress={() => {
							setMediaError(undefined);
							void onAddPhoto().catch(error => setMediaError(error instanceof Error ? error.message : "Impossible de préparer cette image."));
						}}
					/>
				)}
				{!editing ? <ActionButton label="Modifier" quiet onPress={() => setEditing(true)} /> : null}
				<ActionButton label="Supprimer" danger quiet onPress={confirmDelete} />
			</ExperienceActionsMenu>
			<View style={s.actions}>
				{editing ? (
					<>
						<ActionButton label="Annuler" quiet onPress={() => { setDraft(item.message); setEditing(false); }} />
						<ActionButton label="Enregistrer" onPress={() => { const value = draft.trim(); if (value) onUpdate(value); setEditing(false); }} />
					</>
				) : null}
				{item.status === "DRAFT" ? <ActionButton label="Publier" onPress={onPublish} /> : null}
			</View>
		</View>
	);
}

function ActionButton({ label, onPress, danger = false, quiet = false, disabled = false }: {
	label: string;
	onPress: () => void;
	danger?: boolean;
	quiet?: boolean;
	disabled?: boolean;
}) {
	return <FragmentsButton label={label} onPress={onPress} disabled={disabled}
		variant={danger ? "danger" : quiet ? "tertiary" : "primary"} />;
}
const s = StyleSheet.create({
	card: { padding: spacing.standard, borderRadius: radii.card, gap: spacing.compact, backgroundColor: surfaces.card },
	cardHeader: { alignItems: "flex-start", gap: spacing.micro },
	coffeeName: { ...typography.card, color: palette.textPrimary, width: "100%" },
	statusBadge: { maxWidth: "100%", paddingVertical: 2 },
	statusText: { ...typography.body, color: palette.textSecondary },
	muted: { ...typography.body, color: palette.textMuted },
	body: { ...typography.card, fontWeight: "400", color: palette.textPrimary },
	input: { borderWidth: 1, borderColor: palette.border, borderRadius: radii.control, padding: spacing.compact, minHeight: 96, maxHeight: 160, color: palette.textPrimary, backgroundColor: surfaces.canvas },
	mediaBlock: { gap: spacing.micro },
	actions: { flexDirection: "row", gap: spacing.micro, flexWrap: "wrap" },
	errorText: { ...typography.body, color: palette.danger },
});
