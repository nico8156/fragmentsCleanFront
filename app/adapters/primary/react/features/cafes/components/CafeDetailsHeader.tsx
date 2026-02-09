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
	onBack: () => void;
	onPressLike: () => void;
	onPressComments: () => void;
}) {
	const openFlag = useMemo(() => {
		if (statusLabel === "OUVERT") return true;
		if (statusLabel === "FERMÉ") return false;
		return undefined;
	}, [statusLabel]);

	const haloStyle =
		likeSync?.state === "pending"
			? s.haloPending
			: likeSync?.state === "acked"
				? s.haloAcked
				: likeSync?.state === "failed"
					? s.haloFailed
					: null;

	return (
		<View style={s.wrap}>
			<View style={s.card}>
				{/* Row 1: back + title */}
				<View style={s.topRow}>
					<Pressable onPress={onBack} style={s.iconBtn} hitSlop={10}>
						<SymbolView
							name="chevron.left"
							size={18}
							tintColor={palette.textPrimary_1}
							fallback={<Text style={{ color: palette.textPrimary_1 }}>{"<"}</Text>}
						/>
					</Pressable>

					<Text style={s.topTitle} numberOfLines={1}>
						{title}
					</Text>
				</View>

				{/* Row 2: status + actions */}
				<View style={s.bottomRow}>
					<View style={[s.statusBadge, openFlag === false ? s.statusClosed : s.statusOpen]}>
						<Text style={s.statusBadgeText}>{statusLabel}</Text>
					</View>

					<View style={{ flex: 1 }} />

					<View style={s.actions}>
						{/* LIKE */}
						<Pressable onPress={onPressLike} style={[s.actionPill, likedByMe && s.actionPillActive]} hitSlop={10}>
							{/* halo doux (derrière la pilule) */}
							{haloStyle ? <View pointerEvents="none" style={[s.pillHalo, haloStyle]} /> : null}

							<HeartIcon
								filled={likedByMe}
								size={20}
								color={likedByMe ? palette.accent : palette.textMuted}
							/>
							<Text style={[s.actionCount, likedByMe && s.actionCountActive]}>{likeCount}</Text>
						</Pressable>

						{/* COMMENTS */}
						<Pressable onPress={onPressComments} style={s.actionPill} hitSlop={10}>
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
		gap: 10,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.10)",
	},

	topRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	iconBtn: {
		width: 38,
		height: 38,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.06)",
	},
	topTitle: {
		flex: 1,
		fontSize: 18,
		fontWeight: "900",
		color: palette.textPrimary_1,
		textAlign: "center",
		paddingHorizontal: 6,
	},

	bottomRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},

	statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
	statusOpen: { backgroundColor: "rgba(76, 175, 80, 0.18)" },
	statusClosed: { backgroundColor: "rgba(231, 76, 60, 0.16)" },
	statusBadgeText: { fontSize: 12, fontWeight: "900", color: palette.textPrimary_1, letterSpacing: 0.8 },

	actions: {
		flexDirection: "row",
		gap: 10,
	},

	actionPill: {
		height: 36,
		paddingHorizontal: 12,
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

	// halo discret autour de la pilule like (pas de 3e forme)
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
	haloAcked: { backgroundColor: "rgba(76, 175, 80, 0.35)" },   // vert
	haloFailed: { backgroundColor: "rgba(231, 76, 60, 0.30)" },  // rouge
});
