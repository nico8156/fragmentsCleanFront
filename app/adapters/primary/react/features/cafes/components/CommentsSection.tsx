import { palette } from "@/app/adapters/primary/react/css/colors";
import type { CommentItemVM } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

	const canSend = draft.trim().length > 0;
	const charCount = draft.trim().length;
	const inputRef = useRef<TextInput>(null);

	const submit = useCallback(() => {
		const txt = draft.trim();
		if (!txt) return;
		comments.uiViaHookCreateComment({ targetId: coffeeId, body: txt });
		//handle keyboard dismiss when submit 
		inputRef.current?.blur();
		Keyboard.dismiss();
		// =========================
		setDraft("");
	}, [draft, comments, coffeeId]);

	const title = useMemo(() => `Commentaires (${comments.comments.length})`, [comments.comments.length]);

	return (
		<Section title={title}>
			{/* LIST */}
			{comments.isLoading ? (
				<View style={s.row}>
					<ActivityIndicator />
					<Text style={s.muted}>Chargement…</Text>
				</View>
			) : comments.error ? (
				<View style={s.errorBox}>
					<Text style={s.errorTitle}>Impossible de charger les commentaires</Text>
					<Text style={s.errorText}>{comments.error}</Text>
				</View>
			) : comments.comments.length === 0 ? (
				<View style={s.empty}>
					<Text style={s.emptyTitle}>Aucun commentaire</Text>
					<Text style={s.muted}>Sois le premier à laisser un retour.</Text>
				</View>
			) : (
				<View style={s.list}>
					{comments.comments.map((c) => (
						<CommentCard
							key={c.id}
							item={c}
							onEdit={(body) => comments.uiViaHookUpdateComment({ commentId: c.id, body })}
							onDelete={() => comments.uiViaHookDeleteComment({ commentId: c.id })}
						/>
					))}
				</View>
			)}

			{/* COMPOSER */}
			<View style={s.composer}>
				<View style={s.composerHeader}>
					<Text style={s.composerTitle}>Ajouter un commentaire</Text>

					<View style={s.composerMeta}>
						<Text style={s.counter}>{charCount ? `${charCount}` : "0"}</Text>
						<Text style={s.counterMuted}>car.</Text>
					</View>
				</View>

				<TextInput
					ref={inputRef}
					value={draft}
					onChangeText={setDraft}
					placeholder="Écris un commentaire (court, utile, sympa)…"
					placeholderTextColor={palette.textMuted}
					style={s.input}
					multiline
					textAlignVertical="top"
					selectionColor={palette.accent}
				/>

				<View style={s.composerFooter}>
					<Text style={s.hint} numberOfLines={2}>
						{canSend ? "Prêt à envoyer" : "Astuce : parle de l’ambiance, du café, du service…"}
					</Text>

					<Pressable
						onPress={submit}
						disabled={!canSend}
						style={({ pressed }) => [
							s.sendBtn,
							!canSend && s.sendBtnDisabled,
							pressed && canSend && s.pressed,
						]}
					>
						<SymbolView name="paperplane.fill" size={16} tintColor={palette.textPrimary} fallback={<Text>➤</Text>} />
						<Text style={s.sendText}>Envoyer</Text>
					</Pressable>
				</View>
			</View>
		</Section>
	);
}

function CommentCard({
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
			? { text: "Envoi…", bg: palette.bg_light_30, border: palette.border_muted_30 }
			: item.transportStatus === "failed"
				? { text: "Échec", bg: palette.danger_30, border: palette.danger_60 }
				: item.isOptimistic
					? { text: "Sync", bg: palette.bg_light_30, border: palette.border_muted_30 }
					: null;

	return (
		<View style={s.commentCard}>
			<Image source={{ uri: item.avatarUrl }} style={s.avatar} />

			<View style={s.commentContent}>
				<View style={s.commentHeader}>
					<Text style={s.author} numberOfLines={1}>
						{item.authorName}
					</Text>
					<Text style={s.time}>• {item.relativeTime}</Text>

					{pill ? (
						<View style={[s.pill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
							<Text style={s.pillText}>{pill.text}</Text>
						</View>
					) : null}
				</View>

				{!editing ? (
					<Text style={s.body}>{item.body}</Text>
				) : (
					<View style={s.editWrap}>
						<TextInput
							value={draft}
							onChangeText={setDraft}
							style={s.editInput}
							multiline
							textAlignVertical="top"
							selectionColor={palette.accent}
						/>
						<View style={s.editActions}>
							<Pressable
								onPress={() => {
									setEditing(false);
									setDraft(item.body);
								}}
								style={s.miniBtn}
							>
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
	row: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
	muted: { color: palette.textMuted, fontWeight: "800" },

	// ✅ Liste plus “large”: pas de padding additionnel
	list: { paddingTop: 2, paddingBottom: 8 },

	empty: { paddingVertical: 6 },
	emptyTitle: { fontWeight: "900", color: palette.textPrimary, marginBottom: 4 },

	errorBox: {
		borderRadius: 16,
		backgroundColor: palette.danger_10,
		borderWidth: 1,
		borderColor: palette.danger_30,
		padding: 12,
	},
	errorTitle: { color: palette.textPrimary, fontWeight: "900" },
	errorText: { marginTop: 4, color: palette.textSecondary, fontWeight: "500" },

	// ✅ Cards: moins de padding horizontal, donc ça “prend la place”
	commentCard: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 18,
		backgroundColor: palette.elevated,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		marginBottom: 10,
	},
	avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.bg_dark_50 },

	// ✅ remplace gap (robuste)
	commentContent: { flex: 1, marginLeft: 10 },

	commentHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
	author: { color: palette.textPrimary, fontWeight: "900", maxWidth: 180 },
	time: { color: palette.textMuted, fontWeight: "800", marginLeft: 6 },

	pill: {
		marginLeft: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
		borderWidth: 1,
	},
	pillText: { color: palette.textPrimary, fontWeight: "900", fontSize: 12 },

	body: { marginTop: 6, color: palette.textPrimary, fontWeight: "500", lineHeight: 19 },

	actions: { flexDirection: "row", marginTop: 10 },
	actionBtn: { paddingVertical: 4, marginRight: 14 },
	actionText: { color: palette.textSecondary, fontWeight: "900", fontSize: 13 },
	danger: { color: palette.danger },

	editWrap: { marginTop: 8 },
	editInput: {
		minHeight: 70,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		backgroundColor: palette.surface,
		padding: 12,
		color: palette.textPrimary,
		fontWeight: "500",
	},
	editActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
	miniBtn: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
		backgroundColor: palette.overlay,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		marginLeft: 10,
	},
	miniBtnPrimary: { backgroundColor: palette.accentSoft, borderColor: palette.accent_30 },
	miniBtnText: { fontWeight: "900", color: palette.textPrimary },
	miniBtnTextPrimary: { color: palette.textPrimary },

	// ✅ Composer: moins de padding (la SectionCard pad déjà), mais input plus grand
	composer: {
		marginTop: 8,
		borderRadius: 18,
		backgroundColor: palette.surface,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		padding: 12, // ↓ (au lieu de 14)
	},
	composerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
	composerTitle: { color: palette.textPrimary, fontWeight: "900" },
	composerMeta: { flexDirection: "row", alignItems: "baseline" },
	counter: { color: palette.textSecondary, fontWeight: "900" },
	counterMuted: { marginLeft: 4, color: palette.textMuted, fontWeight: "800", fontSize: 12 },

	input: {
		minHeight: 130, // ✅ plus confortable
		borderRadius: 16,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		backgroundColor: palette.elevated,
		padding: 12,
		color: palette.textPrimary,
		fontWeight: "500",
		lineHeight: 20,
	},

	composerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
	hint: { flex: 1, color: palette.textMuted, fontWeight: "800", marginRight: 12 },

	sendBtn: {
		height: 42,
		paddingHorizontal: 14,
		borderRadius: 16,
		backgroundColor: palette.accentSoft,
		borderWidth: 1,
		borderColor: palette.accent_30,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	sendBtnDisabled: { opacity: 0.45 },
	sendText: { marginLeft: 8, color: palette.textPrimary, fontWeight: "900" },

	pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
