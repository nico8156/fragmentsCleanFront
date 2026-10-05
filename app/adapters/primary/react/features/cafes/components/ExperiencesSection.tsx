import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { Section } from "./Section";
import { ContributionDisclosure } from "./ContributionDisclosure";
import { FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { spacing, surfaces, radii, typography } from "@/app/adapters/primary/react/css/designTokens";
import { ExperienceComposer } from "../../experiences/components/ExperienceComposer";
import { ExperienceActionsMenu } from "../../experiences/components/ExperienceActionsMenu";
import { ExperiencePhoto } from "../../experiences/components/ExperiencePhoto";
import { PassAvatar } from "@/app/adapters/primary/react/features/pass/components/PassAvatar";
import { useExperiencesForCafe } from "@/app/adapters/secondary/viewModel/useExperiencesForCafe";
import type { ExperienceEntity, ExperienceReportReason, LocalImageInput } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import { discardDurableImage, pickDurableImage } from "@/app/adapters/secondary/gateways/media/pickDurableImage";

export function ExperiencesSection({ coffeeId }: { coffeeId: string }) {
	const vm = useExperiencesForCafe(coffeeId); const [message, setMessage] = useState("");
	const [photo, setPhoto] = useState<LocalImageInput>(); const [photoError, setPhotoError] = useState<string>();
	const choosePhoto = () => Alert.alert("Photo de l’expérience", "Choisis une source", [{ text: "Annuler", style: "cancel" }, { text: "Photothèque", onPress: () => void selectPhoto("library") }, { text: "Appareil photo", onPress: () => void selectPhoto("camera") }]);
	const selectPhoto = async (source: "library" | "camera") => { try { setPhotoError(undefined); const selected = await pickDurableImage(source); if (selected) setPhoto(selected); } catch (error) { setPhotoError(error instanceof Error ? error.message : "Impossible de préparer cette image."); } };
	const submit = (draft = false) => { const value = message.trim(); if (!value) return; vm.create(value, draft, photo); setMessage(""); setPhoto(undefined); };
	return <Section title={`Expériences (${vm.experiences.length})`}>
		{vm.isLoading ? <ActivityIndicator accessibilityLabel="Chargement des expériences" /> : vm.error ? <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeTitle}>Expériences enregistrées indisponibles</Text><Pressable accessibilityRole="button" onPress={vm.refresh}><Text style={s.link}>Réessayer</Text></Pressable></View> : vm.experiences.length === 0 ? <View style={s.notice}><Text style={s.noticeTitle}>Aucune expérience partagée pour le moment</Text><Text style={s.muted}>Sois le premier à raconter ta visite.</Text></View> : <View style={s.list}>{vm.experiences.map(item => <ExperienceCard key={item.experienceId} item={item} onEdit={vm.update} onDelete={vm.remove} onReport={vm.report} onBlock={vm.block} onAddPhoto={vm.addPhoto} onDeletePhoto={vm.deletePhoto} />)}</View>}
		<ContributionDisclosure>
			<ExperienceComposer message={message} onChangeMessage={setMessage} canSubmit={Boolean(message.trim())}
				photoUri={photo?.localUri} photoError={photoError} onChoosePhoto={choosePhoto}
				onRemovePhoto={() => { discardDurableImage(photo); setPhoto(undefined); }}
				onSaveDraft={() => submit(true)} onPublish={() => submit(false)} />
		</ContributionDisclosure>
	</Section>;
}

export function ExperienceCard({ item, onEdit, onDelete, onReport, onBlock, onAddPhoto, onDeletePhoto }: { item: ExperienceEntity & { isAuthor: boolean }; onEdit: (id: string, message: string) => void; onDelete: (id: string) => void; onReport: (id: string, reason: ExperienceReportReason) => void; onBlock: (id: string, name?: string, avatar?: string | null) => void; onAddPhoto: (id: string, photo: LocalImageInput) => void; onDeletePhoto: (id: string, mediaId: string) => void }) {
	const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(item.message);
	const [mediaError, setMediaError] = useState<string>();
	const confirmDelete = () => Alert.alert("Supprimer cette expérience ?", "Cette action la retirera de Fragments.", [{ text: "Annuler", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: () => onDelete(item.experienceId) }]);
	const report = () => Alert.alert("Signaler cette expérience", undefined, [{ text: "Spam", onPress: () => onReport(item.experienceId, "SPAM") }, { text: "Contenu inapproprié", onPress: () => onReport(item.experienceId, "OTHER") }, { text: "Annuler", style: "cancel" }]);
	const chooseAdditionalPhoto = () => Alert.alert("Photo de l’expérience", "Choisis une source", [{ text: "Annuler", style: "cancel" }, { text: "Photothèque", onPress: () => void addAdditionalPhoto("library") }, { text: "Appareil photo", onPress: () => void addAdditionalPhoto("camera") }]);
	const addAdditionalPhoto = async (source: "library" | "camera") => { try { setMediaError(undefined); const selected = await pickDurableImage(source); if (selected) onAddPhoto(item.experienceId, selected); } catch (error) { setMediaError(error instanceof Error ? error.message : "Impossible de préparer cette image."); } };
	return <View style={s.card}><View style={s.header}><PassAvatar imageUrl={item.avatarUrl ?? undefined} rings={[]} size={34} accessibilityLabel={`Avatar de ${item.authorName ?? "Utilisateur"}`} /><View style={s.identity}><Text style={s.author}>{item.authorName ?? "Utilisateur"}</Text><Text style={s.muted}>{new Date(item.createdAt).toLocaleDateString("fr-FR")}{item.optimistic ? " · Envoi…" : ""}</Text></View></View>
		{editing ? <><TextInput value={draft} onChangeText={setDraft} autoFocus multiline textAlignVertical="top" maxLength={4000} style={[s.editInput, { minHeight: 96, maxHeight: 160 }]} accessibilityLabel="Modifier mon expérience" /><View style={s.actions}><Pressable accessibilityRole="button" onPress={() => setEditing(false)}><Text style={s.link}>Annuler</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { const value = draft.trim(); if (value) onEdit(item.experienceId, value); setEditing(false); }}><Text style={s.link}>Enregistrer</Text></Pressable></View></> : <Text style={s.body}>{item.message}</Text>}
		{item.media?.[0] ? <><ExperiencePhoto uri={item.media[0].url ?? item.media[0].localUri} mediaId={item.media[0].mediaId} label={`Photo de l’expérience de ${item.authorName ?? "Utilisateur"}`} />{item.media[0].uploadStatus ? <Text accessibilityLiveRegion="polite" style={s.muted}>Photo en attente de synchronisation…</Text> : null}</> : item.isAuthor && !item.optimistic ? <Pressable accessibilityRole="button" onPress={chooseAdditionalPhoto}><Text style={s.link}>Ajouter une photo</Text></Pressable> : null}
		{mediaError ? <Text accessibilityRole="alert" style={s.danger}>{mediaError}</Text> : null}
		{!editing && <ExperienceActionsMenu>{item.isAuthor ? <>
			{item.media?.[0] ? <FragmentsButton label="Supprimer la photo" variant="danger" onPress={() => onDeletePhoto(item.experienceId, item.media![0].mediaId)} /> : null}
			<FragmentsButton label="Modifier" variant="tertiary" onPress={() => setEditing(true)} />
			<FragmentsButton label="Supprimer" variant="danger" onPress={confirmDelete} />
		</> : <>
			<FragmentsButton label="Signaler" variant="tertiary" onPress={report} />
			<FragmentsButton label="Bloquer" variant="danger" onPress={() => onBlock(item.userId, item.authorName, item.avatarUrl)} />
		</>}</ExperienceActionsMenu>}
	</View>;
}

const s = StyleSheet.create({
	list: { gap: spacing.standard },
	notice: { paddingVertical: spacing.compact, gap: 6 },
	noticeTitle: { ...typography.card, color: palette.textPrimary },
	muted: { ...typography.body, color: palette.textMuted },
	card: { padding: spacing.standard, borderRadius: radii.card, backgroundColor: surfaces.card, gap: spacing.compact },
	header: { flexDirection: "row", gap: spacing.compact, alignItems: "center" },
	identity: { flex: 1 },
	author: { ...typography.body, color: palette.textPrimary, fontWeight: "600" },
	body: { ...typography.card, fontWeight: "400", color: palette.textPrimary },
	editInput: { borderWidth: 1, borderColor: palette.border, borderRadius: radii.control, padding: spacing.compact, color: palette.textPrimary },
	actions: { flexDirection: "row", gap: spacing.standard, flexWrap: "wrap" },
	link: { ...typography.body, color: palette.accent },
	danger: { ...typography.body, color: palette.danger },
});
