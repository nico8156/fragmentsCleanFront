import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { pickDurableImage } from "@/app/adapters/secondary/gateways/media/pickDurableImage";
import { buildMyExperienceCardViewModel } from "@/app/adapters/secondary/viewModel/myExperienceCardViewModel";
import { uiExperienceDeleteRequested, uiExperienceMediaAddRequested, uiExperienceMediaDeleteRequested, uiExperiencePublishRequested, uiExperienceUpdateRequested } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import { myExperiencesRetrieval } from "@/app/core-logic/contextWL/experienceWl/usecases/read/experienceRetrieval";
import type { RootStateWl } from "@/app/store/reduxStoreWl";

export function MyExperiencesScreen() {
	const dispatch = useDispatch<any>();
	const state = useSelector((root: RootStateWl) => root.exState);
	const coffees = useSelector((root: RootStateWl) => root.cfState.byId) as Record<string, { name?: string }>;
	useEffect(() => { dispatch(myExperiencesRetrieval()); }, [dispatch]);
	const items = useMemo(
		() => state.mine.ids
			.map(id => state.entities.entities[id])
			.filter((item): item is ExperienceEntity => Boolean(item && item.status !== "DELETED")),
		[state.mine.ids, state.entities.entities],
	);

	return (
		<ProfileLayout refreshing={state.mine.loading === "PENDING"} onRefresh={() => dispatch(myExperiencesRetrieval())}>
			<View style={s.intro}>
				<Text style={s.introTitle}>Tes visites partagées</Text>
				<Text style={s.introText}>Retrouve ici tes publications et les brouillons que tu peux encore compléter.</Text>
			</View>
			{state.mine.error ? (
				<Pressable accessibilityRole="button" onPress={() => dispatch(myExperiencesRetrieval())} style={s.retryButton}>
					<Text accessibilityRole="alert" style={s.retryText}>Données enregistrées affichées · Réessayer</Text>
				</Pressable>
			) : null}
			{!items.length && state.mine.loading !== "PENDING" ? (
				<View style={s.empty}>
					<Text style={s.emptyTitle}>Aucune expérience pour le moment</Text>
					<Text style={s.muted}>Tu peux raconter une visite depuis la fiche d’un café, sans ticket.</Text>
				</View>
			) : (
				<View style={s.list}>
					{items.map(item => (
						<MineCard
							key={item.experienceId}
							item={item}
							coffeeName={coffees[item.coffeeId]?.name}
							onUpdate={(message) => dispatch(uiExperienceUpdateRequested({ experienceId: item.experienceId, message }))}
							onPublish={() => dispatch(uiExperiencePublishRequested({ experienceId: item.experienceId }))}
							onDelete={() => dispatch(uiExperienceDeleteRequested({ experienceId: item.experienceId }))}
							onAddPhoto={async () => {
								const photo = await pickDurableImage("library");
								if (photo) dispatch(uiExperienceMediaAddRequested({ experienceId: item.experienceId, photo }));
							}}
							onDeletePhoto={(mediaId) => dispatch(uiExperienceMediaDeleteRequested({ experienceId: item.experienceId, mediaId }))}
						/>
					))}
				</View>
			)}
		</ProfileLayout>
	);
}

type MineCardProps = {
	item: ExperienceEntity;
	coffeeName?: string;
	onUpdate: (value: string) => void;
	onPublish: () => void;
	onDelete: () => void;
	onAddPhoto: () => Promise<void>;
	onDeletePhoto: (mediaId: string) => void;
};

function MineCard({ item, coffeeName, onUpdate, onPublish, onDelete, onAddPhoto, onDeletePhoto }: MineCardProps) {
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
				<Text numberOfLines={2} style={s.coffeeName}>{view.coffeeName}</Text>
				<View style={[s.statusBadge, s[`status_${view.statusTone}`]]}>
					<Text numberOfLines={1} style={s.statusText}>{view.statusLabel}</Text>
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
					<Image source={{ uri: view.mediaUri }} style={s.media} contentFit="cover" accessibilityLabel="Photo de mon expérience" />
					{view.mediaPending ? <Text accessibilityLiveRegion="polite" style={s.muted}>Photo en attente de synchronisation…</Text> : null}
					<ActionButton label="Supprimer la photo" danger onPress={confirmPhotoDelete} />
				</View>
			) : (
				<ActionButton
					label="Ajouter une photo"
					disabled={item.optimistic}
					onPress={() => {
						setMediaError(undefined);
						void onAddPhoto().catch(error => setMediaError(error instanceof Error ? error.message : "Impossible de préparer cette image."));
					}}
				/>
			)}
			{mediaError ? <Text accessibilityRole="alert" style={s.errorText}>{mediaError}</Text> : null}

			<View style={s.actions}>
				{editing ? (
					<>
						<ActionButton label="Annuler" quiet onPress={() => { setDraft(item.message); setEditing(false); }} />
						<ActionButton label="Enregistrer" onPress={() => { const value = draft.trim(); if (value) onUpdate(value); setEditing(false); }} />
					</>
				) : <ActionButton label="Modifier" quiet onPress={() => setEditing(true)} />}
				{item.status === "DRAFT" ? <ActionButton label="Publier" onPress={onPublish} /> : null}
				<ActionButton label="Supprimer" danger quiet onPress={confirmDelete} />
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
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [s.actionButton, quiet && s.actionQuiet, danger && s.actionDanger, disabled && s.disabled, pressed && s.pressed]}
		>
			<Text style={[s.actionText, quiet && s.actionQuietText, danger && s.actionDangerText]}>{label}</Text>
		</Pressable>
	);
}

const s = StyleSheet.create({
	intro: { gap: 5, paddingHorizontal: 2, paddingBottom: 2 },
	introTitle: { color: palette.textPrimary, fontSize: 22, fontWeight: "800" },
	introText: { color: palette.textSecondary, fontSize: 14, lineHeight: 20 },
	retryButton: { alignSelf: "flex-start", paddingVertical: 8 },
	retryText: { color: palette.accent, fontWeight: "700" },
	list: { gap: 14 },
	empty: { padding: 20, gap: 6, borderWidth: 1, borderColor: palette.border, borderRadius: 18, backgroundColor: palette.bg_dark_30 },
	emptyTitle: { color: palette.textPrimary, fontSize: 17, fontWeight: "800" },
	card: { padding: 16, borderWidth: 1, borderColor: palette.border, borderRadius: 18, gap: 14, backgroundColor: palette.bg_dark_30, overflow: "hidden" },
	cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
	coffeeName: { flex: 1, minWidth: 0, color: palette.textPrimary, fontSize: 17, lineHeight: 22, fontWeight: "800" },
	statusBadge: { flexShrink: 0, maxWidth: 112, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: palette.overlay },
	status_draft: { backgroundColor: palette.overlay },
	status_pending: { backgroundColor: palette.accentSoft },
	status_published: { backgroundColor: palette.success_30 },
	status_hidden: { backgroundColor: palette.danger_30 },
	statusText: { color: palette.textPrimary, fontSize: 11, lineHeight: 14, fontWeight: "700" },
	muted: { color: palette.textMuted, fontSize: 13, lineHeight: 18 },
	body: { color: palette.textPrimary, fontSize: 16, lineHeight: 22 },
	input: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 12, minHeight: 96, maxHeight: 160, color: palette.textPrimary, backgroundColor: palette.background },
	mediaBlock: { gap: 9 },
	media: { width: "100%", height: 176, borderRadius: 14, backgroundColor: palette.elevated },
	actions: { flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 2 },
	actionButton: { minHeight: 42, justifyContent: "center", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: palette.accent },
	actionQuiet: { backgroundColor: palette.overlay, borderWidth: 1, borderColor: palette.border },
	actionDanger: { backgroundColor: palette.danger },
	actionText: { color: palette.background, fontSize: 14, fontWeight: "800" },
	actionQuietText: { color: palette.textPrimary },
	actionDangerText: { color: palette.textPrimary },
	errorText: { color: palette.danger, fontWeight: "700", lineHeight: 19 },
	disabled: { opacity: 0.45 },
	pressed: { opacity: 0.75 },
});

export default MyExperiencesScreen;
