import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { Section } from "./Section";
import { PassAvatar } from "@/app/adapters/primary/react/features/pass/components/PassAvatar";
import { useExperiencesForCafe } from "@/app/adapters/secondary/viewModel/useExperiencesForCafe";
import type { ExperienceEntity, ExperienceReportReason } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

export function ExperiencesSection({ coffeeId }: { coffeeId: string }) {
	const vm = useExperiencesForCafe(coffeeId); const [message, setMessage] = useState("");
	const submit = (draft = false) => { const value = message.trim(); if (!value) return; vm.create(value, draft); setMessage(""); };
	return <Section title={`Expériences (${vm.experiences.length})`}>
		{vm.isLoading ? <ActivityIndicator accessibilityLabel="Chargement des expériences" /> : vm.error ? <View style={s.notice}><Text style={s.noticeTitle}>Expériences enregistrées indisponibles</Text><Pressable onPress={vm.refresh}><Text style={s.link}>Réessayer</Text></Pressable></View> : vm.experiences.length === 0 ? <View style={s.notice}><Text style={s.noticeTitle}>Aucune expérience partagée pour le moment</Text><Text style={s.muted}>Sois le premier à raconter ta visite.</Text></View> : <View style={s.list}>{vm.experiences.map(item => <ExperienceCard key={item.experienceId} item={item} onEdit={vm.update} onDelete={vm.remove} onReport={vm.report} onBlock={vm.block} />)}</View>}
		<View style={s.composer}>
			<TextInput value={message} onChangeText={setMessage} maxLength={4000} multiline placeholder="Raconte ta visite…" placeholderTextColor={palette.textMuted} style={s.input} accessibilityLabel="Mon expérience" />
			<View style={s.composerActions}><Pressable accessibilityRole="button" disabled={!message.trim()} onPress={() => submit(true)} style={[s.secondaryButton, !message.trim() && s.disabled]}><Text style={s.link}>Enregistrer en brouillon</Text></Pressable><Pressable accessibilityRole="button" disabled={!message.trim()} onPress={() => submit(false)} style={[s.button, !message.trim() && s.disabled]}><Text style={s.buttonText}>Partager mon expérience</Text></Pressable></View>
		</View>
	</Section>;
}

function ExperienceCard({ item, onEdit, onDelete, onReport, onBlock }: { item: ExperienceEntity & { isAuthor: boolean }; onEdit: (id: string, message: string) => void; onDelete: (id: string) => void; onReport: (id: string, reason: ExperienceReportReason) => void; onBlock: (id: string, name?: string, avatar?: string | null) => void }) {
	const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(item.message);
	const confirmDelete = () => Alert.alert("Supprimer cette expérience ?", "Cette action la retirera de Fragments.", [{ text: "Annuler", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: () => onDelete(item.experienceId) }]);
	const report = () => Alert.alert("Signaler cette expérience", undefined, [{ text: "Spam", onPress: () => onReport(item.experienceId, "SPAM") }, { text: "Contenu inapproprié", onPress: () => onReport(item.experienceId, "OTHER") }, { text: "Annuler", style: "cancel" }]);
	return <View style={s.card}><View style={s.header}><PassAvatar imageUrl={item.avatarUrl ?? undefined} rings={[]} size={34} accessibilityLabel={`Avatar de ${item.authorName ?? "Utilisateur"}`} /><View style={s.identity}><Text style={s.author}>{item.authorName ?? "Utilisateur"}</Text><Text style={s.muted}>{new Date(item.createdAt).toLocaleDateString("fr-FR")}{item.optimistic ? " · Envoi…" : ""}</Text></View></View>
		{editing ? <><TextInput value={draft} onChangeText={setDraft} multiline maxLength={4000} style={s.editInput} /><View style={s.actions}><Pressable onPress={() => setEditing(false)}><Text style={s.link}>Annuler</Text></Pressable><Pressable onPress={() => { const value = draft.trim(); if (value) onEdit(item.experienceId, value); setEditing(false); }}><Text style={s.link}>Enregistrer</Text></Pressable></View></> : <Text style={s.body}>{item.message}</Text>}
		{!editing && <View style={s.actions}>{item.isAuthor ? <><Pressable onPress={() => setEditing(true)}><Text style={s.link}>Modifier</Text></Pressable><Pressable onPress={confirmDelete}><Text style={s.danger}>Supprimer</Text></Pressable></> : <><Pressable onPress={report}><Text style={s.link}>Signaler</Text></Pressable><Pressable onPress={() => onBlock(item.userId, item.authorName, item.avatarUrl)}><Text style={s.danger}>Bloquer</Text></Pressable></>}</View>}
	</View>;
}

const s = StyleSheet.create({ list: { gap: 12 }, notice: { paddingVertical: 12, gap: 6 }, noticeTitle: { color: palette.textPrimary, fontWeight: "700" }, muted: { color: palette.textMuted, fontSize: 13 }, composer: { marginTop: 16, gap: 10 }, composerActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 12, flexWrap: "wrap" }, input: { minHeight: 92, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 12, color: palette.textPrimary, backgroundColor: palette.bg_dark_30 }, button: { backgroundColor: palette.accent, borderRadius: 12, padding: 12, alignItems: "center" }, secondaryButton: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 12 }, disabled: { opacity: 0.45 }, buttonText: { color: palette.background, fontWeight: "800" }, card: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.bg_dark_30, gap: 10 }, header: { flexDirection: "row", gap: 10, alignItems: "center" }, identity: { flex: 1 }, author: { color: palette.textPrimary, fontWeight: "700" }, body: { color: palette.textPrimary, lineHeight: 21 }, editInput: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10, color: palette.textPrimary }, actions: { flexDirection: "row", gap: 18 }, link: { color: palette.accent, fontWeight: "700" }, danger: { color: palette.danger, fontWeight: "700" } });
