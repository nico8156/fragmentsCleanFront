import { palette } from "@/app/adapters/primary/react/css/colors";
import type { CommentItemVM } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	findNodeHandle,
	Image,
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	UIManager,
	View,
} from "react-native";
import { Section } from "./Section";

export function CommentsSection({
	coffeeId,
	comments,
	onRequestScrollToComposer,
	onRequestScrollToY,
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
	onRequestScrollToComposer?: () => void;

	/**
	 * Optionnel : permet de scroller vers une coordonnée Y (ex: parent scrollView).
	 * Le parent peut faire : scrollRef.current?.scrollTo({ y, animated: true })
	 */
	onRequestScrollToY?: (y: number) => void;
}) {
	const [draft, setDraft] = useState("");

	const trimmed = draft.trim();
	const canSend = trimmed.length > 0;
	const charCount = trimmed.length;

	const inputRef = useRef<TextInput>(null);

	const submit = useCallback(() => {
		const txt = draft.trim();
		if (!txt) return;

		comments.uiViaHookCreateComment({ targetId: coffeeId, body: txt });

		inputRef.current?.blur();
		Keyboard.dismiss();
		setDraft("");
	}, [draft, comments, coffeeId]);

	const title = useMemo(
		() => `Commentaires (${comments.comments.length})`,
		[comments.comments.length],
	);

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
							onRequestScrollToY={onRequestScrollToY}
						/>
					))}
				</View>
			)}

			{/* COMPOSER (lighter) */}
			<View style={s.composer}>
				<View style={s.composerRow}>
					<TextInput
						ref={inputRef}
						value={draft}
						onChangeText={setDraft}
						onFocus={() => onRequestScrollToComposer?.()}
						placeholder="Écris un commentaire…"
						placeholderTextColor={palette.textMuted}
						style={s.input}
						multiline
						textAlignVertical="top"
						selectionColor={palette.accent}
					/>

					<Pressable
						onPress={submit}
						disabled={!canSend}
						style={({ pressed }) => [
							s.sendIconBtn,
							!canSend && s.sendBtnDisabled,
							pressed && canSend && s.pressed,
						]}
					>
						<SymbolView
							name="paperplane.fill"
							size={16}
							tintColor={palette.textPrimary}
							fallback={<Text>➤</Text>}
						/>
					</Pressable>
				</View>

				{/* show counter only when it starts to matter */}
				{charCount > 220 ? <Text style={s.counterHint}>{charCount} car.</Text> : null}
			</View>
		</Section>
	);
}

function CommentCard({
	item,
	onEdit,
	onDelete,
	onRequestScrollToY,
}: {
	item: CommentItemVM;
	onEdit: (body: string) => void;
	onDelete: () => void;
	onRequestScrollToY?: (y: number) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(item.body);

	const cardRef = useRef<View>(null);
	const editInputRef = useRef<TextInput>(null);

	// flash "Envoyé" when pending -> success
	const [flashSent, setFlashSent] = useState(false);
	const prevStatus = useRef(item.transportStatus);

	// UX safety: if pending stays too long, don't block the UI forever (visual only)
	const [pendingTooLong, setPendingTooLong] = useState(false);

	useEffect(() => setDraft(item.body), [item.body]);

	// pending -> success => flash "Envoyé"
	useEffect(() => {
		if (prevStatus.current === "pending" && item.transportStatus === "success") {
			setFlashSent(true);
			const t = setTimeout(() => setFlashSent(false), 900);
			prevStatus.current = item.transportStatus;
			return () => clearTimeout(t);
		}
		prevStatus.current = item.transportStatus;
	}, [item.transportStatus]);

	// pending "too long" fallback (pure UI)
	useEffect(() => {
		if (item.transportStatus !== "pending") {
			setPendingTooLong(false);
			return;
		}
		const t = setTimeout(() => setPendingTooLong(true), 12_000);
		return () => clearTimeout(t);
	}, [item.transportStatus]);

	const requestScrollIntoView = useCallback(() => {
		if (!onRequestScrollToY) return;
		const node = cardRef.current ? findNodeHandle(cardRef.current) : null;
		if (!node) return;

		// measure position in window; parent decides how to scroll
		UIManager.measureInWindow(node, (_x, y, _w, _h) => {
			// small offset so it doesn't stick to top
			const targetY = Math.max(0, y - 80);
			onRequestScrollToY(targetY);
		});
	}, [onRequestScrollToY]);

	const startEdit = useCallback(() => {
		setEditing(true);

		// next tick: scroll card into view, then focus
		requestAnimationFrame(() => {
			requestScrollIntoView();
			requestAnimationFrame(() => {
				editInputRef.current?.focus();
			});
		});
	}, [requestScrollIntoView]);

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
		item.transportStatus === "failed"
			? { text: "Échec", bg: palette.danger_30, border: palette.danger_60 }
			: item.transportStatus === "pending" && !pendingTooLong
				? { text: "Envoi…", bg: palette.bg_light_30, border: palette.border_muted_30 }
				: flashSent
					? { text: "Envoyé", bg: palette.accentSoft, border: palette.accent_30 }
					: null;

	return (
		<View ref={cardRef} style={s.commentCard}>
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
							ref={editInputRef}
							value={draft}
							onChangeText={setDraft}
							style={s.editInput}
							multiline
							textAlignVertical="top"
							selectionColor={palette.accent}
							onFocus={requestScrollIntoView}
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
						<Pressable onPress={startEdit} style={s.actionBtn}>
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
	muted: { color: palette.textMuted, fontWeight: "700" },

	list: { paddingTop: 2, paddingBottom: 6 },

	empty: { paddingVertical: 6 },
	emptyTitle: { fontWeight: "800", color: palette.textPrimary, marginBottom: 4 },

	errorBox: {
		borderRadius: 16,
		backgroundColor: palette.danger_10,
		borderWidth: 1,
		borderColor: palette.danger_30,
		padding: 12,
	},
	errorTitle: { color: palette.textPrimary, fontWeight: "800" },
	errorText: { marginTop: 4, color: palette.textSecondary, fontWeight: "500" },

	// --- comment card (slightly lighter)
	commentCard: {
		flexDirection: "row",
		paddingVertical: 9,
		paddingHorizontal: 9,
		borderRadius: 18,
		backgroundColor: palette.elevated,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		marginBottom: 9,
	},
	avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.bg_dark_50 },

	commentContent: { flex: 1, marginLeft: 10 },

	commentHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
	author: { color: palette.textPrimary, fontWeight: "800", maxWidth: 180 },
	time: { color: palette.textMuted, fontWeight: "700", marginLeft: 6, fontSize: 12 },

	pill: {
		marginLeft: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
		borderWidth: 1,
	},
	pillText: { color: palette.textPrimary, fontWeight: "800", fontSize: 12 },

	body: {
		marginTop: 6,
		color: palette.textPrimary,
		fontWeight: "400",
		lineHeight: 19,
		fontSize: 14,
	},

	// actions as chips
	actions: { flexDirection: "row", marginTop: 10 },
	actionBtn: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: palette.overlay,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		marginRight: 10,
	},
	actionText: { color: palette.textSecondary, fontWeight: "800", fontSize: 13 },
	danger: { color: palette.danger },

	// edit
	editWrap: { marginTop: 8 },
	editInput: {
		minHeight: 76,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		backgroundColor: palette.surface,
		padding: 12,
		color: palette.textPrimary,
		fontWeight: "400",
		fontSize: 14,
		lineHeight: 20,
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
	miniBtnText: { fontWeight: "800", color: palette.textPrimary },
	miniBtnTextPrimary: { color: palette.textPrimary },

	// --- composer
	composer: {
		marginTop: 8,
		borderRadius: 18,
		backgroundColor: palette.surface,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		padding: 9,
	},
	composerRow: {
		flexDirection: "row",
		alignItems: "flex-end",
	},

	input: {
		flex: 1,
		minHeight: 92,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		backgroundColor: palette.elevated,
		padding: 10,
		color: palette.textPrimary,
		fontWeight: "400",
		fontSize: 14,
		lineHeight: 20,
	},

	sendIconBtn: {
		marginLeft: 10,
		height: 44,
		width: 44,
		borderRadius: 16,
		backgroundColor: palette.accentSoft,
		borderWidth: 1,
		borderColor: palette.accent_30,
		alignItems: "center",
		justifyContent: "center",
	},
	sendBtnDisabled: { opacity: 0.45 },

	counterHint: {
		marginTop: 8,
		color: palette.textMuted,
		fontWeight: "700",
		fontSize: 12,
		textAlign: "right",
	},

	pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
