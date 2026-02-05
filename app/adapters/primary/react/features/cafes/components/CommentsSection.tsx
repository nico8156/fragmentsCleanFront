import { palette } from "@/app/adapters/primary/react/css/colors";
import type { CommentItemVM } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Section } from "./Section";

export function CommentsSection({
	coffeeId,
	comments,
}: {
	coffeeId: string;
	comments: {
		comments: CommentItemVM[];
		isLoading: boolean;
		isRefreshing: boolean;
		error?: string;
		uiViaHookCreateComment: (p: { targetId: string; body: string }) => void;
		uiViaHookUpdateComment: (p: { commentId: string; body: string }) => void;
		uiViaHookDeleteComment: (p: { commentId: string }) => void;
	};
}) {
	const [draft, setDraft] = useState("");

	const submit = useCallback(() => {
		const txt = draft.trim();
		if (!txt) return;
		comments.uiViaHookCreateComment({ targetId: coffeeId, body: txt });
		setDraft("");
	}, [draft, comments, coffeeId]);

	return (
		<Section title={`Commentaires (${comments.comments.length})`}>
			{comments.isLoading ? (
				<Row>
					<ActivityIndicator />
					<Text style={s.muted}>Chargement…</Text>
				</Row>
			) : comments.error ? (
				<Text style={s.error}>Erreur: {comments.error}</Text>
			) : comments.comments.length === 0 ? (
				<View style={s.empty}>
					<Text style={s.emptyTitle}>Aucun commentaire</Text>
					<Text style={s.muted}>Sois le premier à laisser un retour.</Text>
				</View>
			) : (
				<View style={{ gap: 10 }}>
					{comments.comments.map((c) => (
						<CommentRow
							key={c.id}
							item={c}
							onEdit={(body) => comments.uiViaHookUpdateComment({ commentId: c.id, body })}
							onDelete={() => comments.uiViaHookDeleteComment({ commentId: c.id })}
						/>
					))}
				</View>
			)}

			<View style={s.composer}>
				<View style={s.composerTop}>
					<View style={s.avatarFallback}>
						<Text style={s.avatarFallbackText}>🙂</Text>
					</View>

					<View style={{ flex: 1, gap: 8 }}>
						<TextInput
							value={draft}
							onChangeText={setDraft}
							placeholder="Ajouter un commentaire…"
							placeholderTextColor={palette.textMuted}
							style={s.input}
							multiline
						/>

						<View style={s.composerActions}>
							<Text style={s.hint}>{draft.trim().length ? `${draft.trim().length} caractères` : "Sois concis et utile"}</Text>

							<Pressable
								onPress={submit}
								disabled={!draft.trim()}
								style={({ pressed }) => [
									s.sendBtn,
									!draft.trim() && s.sendBtnDisabled,
									pressed && draft.trim() ? s.pressed : null,
								]}
							>
								<SymbolView name="paperplane.fill" size={16} tintColor="white" fallback={<Text>➤</Text>} />
								<Text style={s.sendText}>Envoyer</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</View>
		</Section>
	);
}

function Row({ children }: { children: React.ReactNode }) {
	return <View style={s.row}>{children}</View>;
}

function CommentRow({
	item,
	onEdit,
	onDelete,
}: {
	item: CommentItemVM;
	onEdit: (body: string) => void;
	onDelete: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(item.body);

	useEffect(() => setDraft(item.body), [item.body]);

	const save = () => {
		const txt = draft.trim();
		if (!txt || txt === item.body) {
			setEditing(false);
			setDraft(item.body);
			return;
		}
		onEdit(txt);
		setEditing(false);
	};

	const pill =
		item.transportStatus === "pending"
			? { text: "Envoi…", style: s.pillPending }
			: item.transportStatus === "failed"
				? { text: "Échec", style: s.pillFailed }
				: item.isOptimistic
					? { text: "Sync", style: s.pillPending }
					: null;

	return (
		<View style={s.commentRow}>
			<Image source={{ uri: item.avatarUrl }} style={s.avatar} />

			<View style={{ flex: 1, gap: 6 }}>
				<View style={s.header}>
					<Text style={s.author} numberOfLines={1}>
						{item.authorName}
					</Text>
					<Text style={s.time}>{item.relativeTime}</Text>
					{pill ? (
						<View style={[s.pill, pill.style]}>
							<Text style={s.pillText}>{pill.text}</Text>
						</View>
					) : null}
				</View>

				{!editing ? (
					<Text style={s.body}>{item.body}</Text>
				) : (
					<View style={{ gap: 8 }}>
						<TextInput value={draft} onChangeText={setDraft} style={s.editInput} multiline />
						<View style={s.editActions}>
							<Pressable onPress={() => { setEditing(false); setDraft(item.body); }} style={s.miniBtn}>
								<Text style={s.miniBtnText}>Annuler</Text>
							</Pressable>
							<Pressable onPress={save} style={[s.miniBtn, s.miniBtnPrimary]}>
								<Text style={[s.miniBtnText, s.miniBtnTextPrimary]}>Enregistrer</Text>
							</Pressable>
						</View>
					</View>
				)}

				{item.isAuthor && !editing ? (
					<View style={s.actions}>
						<Pressable onPress={() => setEditing(true)} style={s.actionBtn}>
							<Text style={s.actionText}>Modifier</Text>
						</Pressable>
						<Pressable onPress={onDelete} style={s.actionBtn}>
							<Text style={[s.actionText, s.danger]}>Supprimer</Text>
						</Pressable>
					</View>
				) : null}
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 10 },

	muted: { color: palette.textMuted, fontWeight: "800" },
	error: { color: "#E74C3C", fontWeight: "900" },

	empty: { paddingVertical: 6, gap: 4 },
	emptyTitle: { fontWeight: "900", color: palette.textPrimary_1 },

	composer: {
		marginTop: 12,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
		backgroundColor: "white",
		padding: 12,
	},
	composerTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
	avatarFallback: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(0,0,0,0.06)",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarFallbackText: { fontSize: 16 },

	input: {
		minHeight: 44,
		maxHeight: 140,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: "rgba(0,0,0,0.03)",
		color: palette.textPrimary_1,
		fontWeight: "700",
	},
	composerActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	hint: { fontSize: 12, fontWeight: "800", color: palette.textMuted },

	sendBtn: {
		height: 40,
		borderRadius: 14,
		paddingHorizontal: 12,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#4CAF50",
	},
	sendBtnDisabled: { backgroundColor: "rgba(0,0,0,0.18)" },
	sendText: { fontSize: 14, fontWeight: "900", color: "white" },
	pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

	commentRow: { flexDirection: "row", gap: 10, paddingVertical: 6 },
	avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.06)" },

	header: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
	author: { fontSize: 14, fontWeight: "900", color: palette.textPrimary_1, maxWidth: 170 },
	time: { fontSize: 12, fontWeight: "800", color: palette.textMuted },

	pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
	pillText: { fontSize: 12, fontWeight: "900", color: palette.textPrimary_1 },
	pillPending: { backgroundColor: "rgba(0,0,0,0.06)" },
	pillFailed: { backgroundColor: "rgba(231, 76, 60, 0.18)" },

	body: { fontSize: 14, fontWeight: "700", color: palette.textPrimary_1, lineHeight: 19 },

	actions: { flexDirection: "row", gap: 14, paddingTop: 2 },
	actionBtn: { paddingVertical: 4 },
	actionText: { fontSize: 13, fontWeight: "900", color: palette.textMuted },
	danger: { color: "#E74C3C" },

	editInput: {
		minHeight: 60,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.10)",
		backgroundColor: "white",
		padding: 12,
		color: palette.textPrimary_1,
		fontWeight: "700",
	},
	editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
	miniBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.06)" },
	miniBtnPrimary: { backgroundColor: "#4CAF50" },
	miniBtnText: { fontWeight: "900", color: palette.textPrimary_1 },
	miniBtnTextPrimary: { color: "white" },
});
