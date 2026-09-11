import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { palette } from "@/app/adapters/primary/react/css/colors";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import { myExperiencesRetrieval } from "@/app/core-logic/contextWL/experienceWl/usecases/read/experienceRetrieval";
import { uiExperienceDeleteRequested, uiExperiencePublishRequested, uiExperienceUpdateRequested } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

export function MyExperiencesScreen() {
	const dispatch = useDispatch<any>(); const state = useSelector((root: RootStateWl) => root.exState);
	const coffees = useSelector((root: RootStateWl) => root.cfState.byId) as Record<string, { name?: string }>;
	useEffect(() => { dispatch(myExperiencesRetrieval()); }, [dispatch]);
	const items = useMemo(() => state.mine.ids.map(id => state.entities.entities[id]).filter((item): item is ExperienceEntity => Boolean(item && item.status !== "DELETED")), [state.mine.ids, state.entities.entities]);
	return <ProfileLayout refreshing={state.mine.loading === "PENDING"} onRefresh={() => dispatch(myExperiencesRetrieval())}>
		<ProfileCard title="Mes expériences" subtitle="Tes visites partagées et tes brouillons">
			{state.mine.error ? <Pressable onPress={() => dispatch(myExperiencesRetrieval())}><Text style={s.error}>Données enregistrées affichées. Réessayer</Text></Pressable> : null}
			{!items.length && state.mine.loading !== "PENDING" ? <View style={s.empty}><Text style={s.title}>Aucune expérience pour le moment</Text><Text style={s.muted}>Tu peux raconter une visite depuis la fiche d’un café, sans ticket.</Text></View> : <View style={s.list}>{items.map(item => <MineCard key={item.experienceId} item={item} coffeeName={coffees[item.coffeeId]?.name} onUpdate={(message) => dispatch(uiExperienceUpdateRequested({ experienceId: item.experienceId, message }))} onPublish={() => dispatch(uiExperiencePublishRequested({ experienceId: item.experienceId }))} onDelete={() => dispatch(uiExperienceDeleteRequested({ experienceId: item.experienceId }))} />)}</View>}
		</ProfileCard>
	</ProfileLayout>;
}

function MineCard({ item, coffeeName, onUpdate, onPublish, onDelete }: { item: ExperienceEntity; coffeeName?: string; onUpdate: (value: string) => void; onPublish: () => void; onDelete: () => void }) {
	const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(item.message);
	return <View style={s.card}><View style={s.row}><Text style={s.title}>{coffeeName ?? "Café visité"}</Text><Text style={s.status}>{item.status === "DRAFT" ? "Brouillon" : item.moderationStatus === "HIDDEN" ? "Masquée" : item.optimistic ? "Synchronisation…" : "Publiée"}</Text></View>
		{editing ? <TextInput value={draft} onChangeText={setDraft} multiline maxLength={4000} style={s.input} /> : <Text style={s.body}>{item.message}</Text>}
		<View style={s.actions}>{editing ? <><Pressable onPress={() => setEditing(false)}><Text style={s.link}>Annuler</Text></Pressable><Pressable onPress={() => { const value = draft.trim(); if (value) onUpdate(value); setEditing(false); }}><Text style={s.link}>Enregistrer</Text></Pressable></> : <Pressable onPress={() => setEditing(true)}><Text style={s.link}>Modifier</Text></Pressable>}{item.status === "DRAFT" && <Pressable onPress={onPublish}><Text style={s.link}>Publier</Text></Pressable>}<Pressable onPress={onDelete}><Text style={s.error}>Supprimer</Text></Pressable></View>
	</View>;
}

const s = StyleSheet.create({ list: { gap: 12 }, empty: { paddingVertical: 16, gap: 6 }, card: { padding: 14, borderWidth: 1, borderColor: palette.border, borderRadius: 14, gap: 10 }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, title: { color: palette.textPrimary, fontWeight: "800" }, status: { color: palette.textMuted }, muted: { color: palette.textMuted, lineHeight: 20 }, body: { color: palette.textPrimary, lineHeight: 21 }, input: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10, minHeight: 80, color: palette.textPrimary }, actions: { flexDirection: "row", gap: 16, flexWrap: "wrap" }, link: { color: palette.accent, fontWeight: "700" }, error: { color: palette.danger, fontWeight: "700" } });
