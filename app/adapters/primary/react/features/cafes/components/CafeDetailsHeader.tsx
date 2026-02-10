import { palette } from "@/app/adapters/primary/react/css/colors";
import { HeartIcon } from "@/app/adapters/primary/react/features/cafes/components/HeartIcon";
import { SymbolView } from "expo-symbols";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function CafeDetailsHeader({
	title,
	statusLabel,
	likeCount,
	likedByMe,
	likeSync,
	commentCount,
	commentSync,
	onBack,
	onPressLike,
	onPressComments,
}: {
	title: string;
	statusLabel: "OUVERT" | "FERMÉ" | "STATUT" | string;
	likeCount: number;
	likedByMe: boolean;
	likeSync: { state: "pending" | "acked" | "failed"; untilMs: number } | null;

	commentCount: number;
	commentSync: { state: "pending" | "acked" | "failed"; untilMs: number } | null;

	onBack: () => void;
	onPressLike: () => void;
	onPressComments: () => void;
}) {
	const openFlag = useMemo(() => {
		if (statusLabel === "OUVERT") return true;
		if (statusLabel === "FERMÉ") return false;
		return undefined;
	}, [statusLabel]);

	const haloStyleFor = (sync: { state: "pending" | "acked" | "failed"; untilMs: number } | null) =>
		sync?.state === "pending"
			? s.haloPending
			: sync?.state === "acked"
				? s.haloAcked
				: sync?.state === "failed"
					? s.haloFailed
					: null;

	const likeHaloStyle = haloStyleFor(likeSync);
	const commentHaloStyle = haloStyleFor(commentSync);

	return (
		<View style={s.wrap}>
			<View style={s.card}>
				{/* Row 1: balanced title (true centered) */}
				<View style={s.topRow}>
					<Pressable onPress={onBack} style={s.iconBtn} hitSlop={10}>
						<SymbolView
							name="chevron.left"
							size={18}
							tintColor={palette.textPrimary_1}
							fallback={<Text style={{ color: palette.textPrimary_1 }}>{"<"}</Text>}
						/>
					</Pressable>

					<View style={s.titleWrap}>
						<Text style={s.topTitle} numberOfLines={1}>
							{title}
						</Text>
					</View>

					{/* right spacer to keep title centered */}
					<View style={s.iconBtnSpacer} />
				</View>

				{/* Row 2: status aligned + actions */}
				<View style={s.bottomRow}>
					<View style={[s.statusPill, openFlag === false ? s.statusClosed : s.statusOpen]}>
						<Text style={s.statusText}>{statusLabel}</Text>
					</View>

					<View style={{ flex: 1 }} />

					<View style={s.actions}>
						{/* LIKE */}
						<Pressable
							onPress={onPressLike}
							style={({ pressed }) => [
								s.actionPill,
								likedByMe && s.actionPillActive,
								pressed && s.pressed,
							]}
							hitSlop={10}
						>
							{likeHaloStyle ? <View pointerEvents="none" style={[s.pillHalo, likeHaloStyle]} /> : null}

							<HeartIcon
								filled={likedByMe}
								size={20}
								color={likedByMe ? palette.accent : palette.textMuted}
							/>
							<Text style={[s.actionCount, likedByMe && s.actionCountActive]}>{likeCount}</Text>
						</Pressable>

						{/* COMMENTS */}
						<Pressable
							onPress={onPressComments}
							style={({ pressed }) => [s.actionPill, pressed && s.pressed]}
							hitSlop={10}
						>
							{commentHaloStyle ? <View pointerEvents="none" style={[s.pillHalo, commentHaloStyle]} /> : null}

							<SymbolView
								name="bubble.left.fill"
								size={18}
								tintColor={palette.textMuted}
								fallback={<Text style={{ color: palette.textMuted }}>💬</Text>}
							/>
							<Text style={s.actionCount}>{commentCount}</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	wrap: {
		backgroundColor: palette.background_1,
		paddingHorizontal: 16,
		paddingTop: 6,
		paddingBottom: 10,
	},

	card: {
		borderRadius: 18,
		paddingHorizontal: 12,
		paddingTop: 10,
		paddingBottom: 12,
		backgroundColor: "rgba(0,0,0,0.04)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.10)",
	},

	// --- Row 1
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},

	iconBtn: {
		width: 40,
		height: 40,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.10)",
	},

	iconBtnSpacer: {
		width: 40,
		height: 40,
	},

	titleWrap: {
		flex: 1,
		alignItems: "center",
		paddingHorizontal: 10,
	},

	topTitle: {
		fontSize: 18,
		fontWeight: "900",
		color: palette.textPrimary_1,
		textAlign: "center",
	},

	// --- Row 2
	bottomRow: {
		flexDirection: "row",
		alignItems: "center",
	},

	// status aligned with pills height
	statusPill: {
		height: 40,
		paddingHorizontal: 12,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.10)",
	},
	statusOpen: { backgroundColor: "rgba(76, 175, 80, 0.16)" },
	statusClosed: { backgroundColor: "rgba(231, 76, 60, 0.14)" },
	statusText: {
		fontSize: 12,
		fontWeight: "900",
		color: palette.textPrimary_1,
		letterSpacing: 0.7,
	},

	actions: {
		flexDirection: "row",
		gap: 10,
	},

	// bigger pills
	actionPill: {
		height: 40,
		paddingHorizontal: 14,
		borderRadius: 999,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.10)",
		overflow: "visible",
	},

	actionPillActive: {
		backgroundColor: "rgba(255,255,255,0.10)",
		borderColor: "rgba(255,255,255,0.18)",
	},

	actionCount: {
		fontSize: 13,
		fontWeight: "900",
		color: palette.textPrimary_1,
		opacity: 0.9,
	},
	actionCountActive: {
		opacity: 1,
	},

	pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

	// halo
	pillHalo: {
		position: "absolute",
		left: -2,
		right: -2,
		top: -2,
		bottom: -2,
		borderRadius: 999,
		opacity: 0.22,
	},
	haloPending: { backgroundColor: "rgba(255, 165, 0, 0.45)" }, // orange
	haloAcked: { backgroundColor: "rgba(76, 175, 80, 0.35)" }, // vert
	haloFailed: { backgroundColor: "rgba(231, 76, 60, 0.30)" }, // rouge
});

