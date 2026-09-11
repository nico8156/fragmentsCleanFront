import { palette } from "@/app/adapters/primary/react/css/colors";
import { PassAvatar } from "@/app/adapters/primary/react/features/pass/components/PassAvatar";
import type { CommentItemVM } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { PassRingViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	findNodeHandle,
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	UIManager,
	View,
} from "react-native";
import { Section } from "./Section";
import type { ReportReason } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

export function CommentsSection({
	coffeeId,
	comments,
	onRequestScrollToComposer,
	onRequestEnsureVisible,
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
		uiViaHookReportComment: (p: { commentId: string; reason: ReportReason }) => void;
		uiViaHookBlockUser: (p: { userId: string; displayName?: string; avatarUrl?: string }) => void;
	};
	onRequestScrollToComposer?: () => void;
	onRequestEnsureVisible?: (rect: { windowY: number; height: number }) => void;
}) {
	const [draft, setDraft] = useState("");

	const trimmed = draft.trim();
	const canSend = trimmed.length > 0;
	const charCount = trimmed.length;
	const pass = usePassRingsViewModel();

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
							onReport={(reason) => comments.uiViaHookReportComment({ commentId: c.id, reason })}
							onBlock={() => comments.uiViaHookBlockUser({ userId: c.authorId, displayName: c.authorName, avatarUrl: c.avatarUrl })}
							onRequestEnsureVisible={onRequestEnsureVisible}
							earnedRings={c.isAuthor ? pass.displayRings : []}
						/>
					))}
				</View>
			)}

			{/* COMPOSER (lighter) */}
			<View style={s.composer}>
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
						tintColor={palette.danger}
						fallback={<Text>➤</Text>}
					/>
				</Pressable>

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
	onReport,
	onBlock,
	onRequestEnsureVisible,
	earnedRings,
}: {
	item: CommentItemVM;
	onEdit: (body: string) => void;
	onDelete: () => void;
	onReport: (reason: ReportReason) => void;
	onBlock: () => void;
	onRequestEnsureVisible?: (rect: { windowY: number; height: number }) => void;
	earnedRings: PassRingViewModel[];
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(item.body);
	const [reporting, setReporting] = useState(false);

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

	const requestEditInputVisible = useCallback(() => {
		if (!onRequestEnsureVisible) return;
		const node = editInputRef.current
			? findNodeHandle(editInputRef.current)
			: cardRef.current
				? findNodeHandle(cardRef.current)
				: null;
		if (!node) return;

		UIManager.measureInWindow(node, (_x, windowY, _w, height) => {
			onRequestEnsureVisible({ windowY, height });
		});
	}, [onRequestEnsureVisible]);

	const startEdit = useCallback(() => {
		setEditing(true);

		requestAnimationFrame(() => {
			editInputRef.current?.focus();
			requestAnimationFrame(requestEditInputVisible);
			setTimeout(requestEditInputVisible, 280);
		});
	}, [requestEditInputVisible]);

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
			: item.transportStatus === "pending" && item.showPendingFeedback && !pendingTooLong
				? { text: "Envoi…", bg: palette.bg_light_30, border: palette.border_muted_30 }
				: flashSent
					? { text: "Envoyé", bg: palette.accentSoft, border: palette.accent_30 }
					: null;

	return (
		<View ref={cardRef} style={s.commentCard}>
			<PassAvatar
				imageUrl={item.avatarUrl}
				rings={earnedRings}
				size={30}
				accessibilityLabel={`${item.authorName}, avatar`}
			/>

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
							onFocus={() => {
								requestAnimationFrame(requestEditInputVisible);
								setTimeout(requestEditInputVisible, 280);
							}}
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
				) : !editing ? (
					<View style={s.actions}>
						<Pressable onPress={() => setReporting(value => !value)} style={s.actionBtn} accessibilityRole="button">
							<Text style={s.actionText}>Signaler</Text>
						</Pressable>
						<Pressable onPress={() => Alert.alert("Bloquer cet utilisateur ?", "Ses commentaires seront masqués pour toi.", [
							{ text: "Annuler", style: "cancel" }, { text: "Bloquer", style: "destructive", onPress: onBlock },
						])} style={s.actionBtn} accessibilityRole="button">
							<Text style={[s.actionText, s.danger]}>Bloquer</Text>
						</Pressable>
					</View>
				) : null}
				{reporting ? <ReportReasons onCancel={() => setReporting(false)} onSelect={(reason) => { setReporting(false); onReport(reason); }} /> : null}
			</View>
		</View>
	);
}

const REPORT_REASONS: {label:string; value:ReportReason}[] = [
	{label:"Harcèlement",value:"HARASSMENT"},{label:"Discours haineux",value:"HATE_SPEECH"},
	{label:"Contenu sexuel",value:"SEXUAL_CONTENT"},{label:"Violence",value:"VIOLENCE"},
	{label:"Spam",value:"SPAM"},{label:"Information trompeuse",value:"FALSE_INFORMATION"},{label:"Autre",value:"OTHER"},
];

function ReportReasons({onSelect,onCancel}:{onSelect:(reason:ReportReason)=>void;onCancel:()=>void}) {
	return <View style={s.reportBox} accessibilityRole="summary">
		<Text style={s.reportTitle}>Pourquoi signales-tu ce commentaire ?</Text>
		{REPORT_REASONS.map(reason => <Pressable key={reason.value} onPress={() => onSelect(reason.value)} style={s.reportReason}>
			<Text style={s.actionText}>{reason.label}</Text>
		</Pressable>)}
		<Pressable onPress={onCancel} style={s.reportReason}><Text style={s.muted}>Annuler</Text></Pressable>
	</View>;
}

const s = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
	muted: { color: palette.textMuted, fontWeight: "700" },

	list: { paddingTop: 2, paddingBottom: 6 },
	reportBox: { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: palette.bg_light_30, gap: 4 },
	reportTitle: { color: palette.textPrimary, fontWeight: "800", marginBottom: 4 },
	reportReason: { minHeight: 40, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border_muted_30 },

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
		position: "relative",
	},

	input: {
		width: "100%",
		minHeight: 92,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		backgroundColor: palette.elevated,
		padding: 10,
		paddingRight: 58,
		paddingBottom: 44,
		color: palette.textPrimary,
		fontWeight: "400",
		fontSize: 14,
		lineHeight: 20,
	},

	sendIconBtn: {
		position: "absolute",
		right: 18,
		bottom: 18,
		height: 44,
		width: 44,
		borderRadius: 22,
		backgroundColor: palette.danger_30,
		borderWidth: 1,
		borderColor: palette.danger,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000000",
		shadowOpacity: 0.18,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
	},
	sendBtnDisabled: {
		opacity: 0.5,
		backgroundColor: palette.overlay,
		borderColor: palette.border_muted_30,
	},

	counterHint: {
		marginTop: 8,
		color: palette.textMuted,
		fontWeight: "700",
		fontSize: 12,
		textAlign: "right",
	},

	pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
