import { palette } from "@/app/adapters/primary/react/css/colors";
import { SymbolView } from "expo-symbols";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function CafeDetailsHeader({
	title,
	addressLine,
	status,
	likeCount,
	likedByMe,
	isLikeBusy,
	isOptimistic,
	commentCount,
	onBack,
	onRefresh,
	onPressLike,
	onPressComments,
}: {
	title: string;
	addressLine: string;
	status: { label: string; value: string };
	likeCount: number;
	likedByMe: boolean;
	isLikeBusy: boolean;
	isOptimistic?: boolean;
	commentCount: number;
	onBack: () => void;
	onRefresh: () => void;
	onPressLike: () => void;
	onPressComments: () => void;
}) {
	const showSync = Boolean(isOptimistic || isLikeBusy);

	const openFlag = useMemo(() => {
		if (status.label === "OUVERT") return true;
		if (status.label === "FERMÉ") return false;
		return undefined;
	}, [status.label]);

	const likeDisabled = isLikeBusy;

	return (
		<View style={s.wrap}>
			{/* Single unified card */}
			<View style={s.card}>
				{/* Row 1: back + title + refresh */}
				<View style={s.topRow}>
					<Pressable onPress={onBack} style={s.iconBtn} hitSlop={10}>
						<SymbolView
							name="chevron.left"
							size={18}
							tintColor={palette.textPrimary_1}
							fallback={<Text>{"<"}</Text>}
						/>
					</Pressable>

					<Text style={s.topTitle} numberOfLines={1}>
						{title}
					</Text>

					<Pressable onPress={onRefresh} style={s.iconBtn} hitSlop={10}>
						<SymbolView
							name="arrow.clockwise"
							size={16}
							tintColor={palette.textMuted}
							fallback={<Text>↻</Text>}
						/>
					</Pressable>
				</View>

				{/* Row 2: address */}
				{!!addressLine ? (
					<Text style={s.address} numberOfLines={2}>
						{addressLine}
					</Text>
				) : null}

				{/* Row 3: status + social pills */}
				<View style={s.bottomRow}>
					<View style={[s.statusBadge, openFlag === false ? s.statusClosed : s.statusOpen]}>
						<Text style={s.statusBadgeText}>{status.label}</Text>
					</View>

					<Text style={s.statusText} numberOfLines={1}>
						{status.value}
					</Text>

					<View style={s.pills}>
						<Pressable
							onPress={onPressLike}
							disabled={likeDisabled}
							style={[
								s.pill,
								likedByMe && s.pillActive,
								likeDisabled && s.pillDisabled,
							]}
							hitSlop={10}
						>
							<SymbolView
								name={likedByMe ? "heart.fill" : "heart"}
								size={16}
								tintColor={likedByMe ? palette.accent : palette.textMuted}
								fallback={<Text>♥</Text>}
							/>
							<Text style={[s.pillLabel, likedByMe && s.pillLabelActive]}>
								J’aime
							</Text>
							<Text style={[s.pillCount, likedByMe && s.pillLabelActive]}>
								{likeCount}
							</Text>
						</Pressable>

						<Pressable onPress={onPressComments} style={s.pill} hitSlop={10}>
							<SymbolView
								name="bubble.left.fill"
								size={16}
								tintColor={palette.textMuted}
								fallback={<Text>💬</Text>}
							/>
							<Text style={s.pillLabel}>Avis</Text>
							<Text style={s.pillCount}>{commentCount}</Text>
						</Pressable>
					</View>
				</View>

				{showSync ? (
					<View style={s.syncRow}>
						<ActivityIndicator size="small" />
						<Text style={s.syncText}>Sync…</Text>
					</View>
				) : null}
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
		backgroundColor: "rgba(0,0,0,0.04)", // tu ajusteras (glass/overlay)
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
	address: {
		fontSize: 13,
		fontWeight: "700",
		color: palette.textMuted,
		paddingHorizontal: 4,
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
	statusText: { flex: 1, fontSize: 12, fontWeight: "800", color: palette.textPrimary_1, opacity: 0.85 },

	pills: {
		flexDirection: "row",
		gap: 8,
	},
	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		height: 34,
		borderRadius: 999,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.10)",
	},
	pillActive: {
		backgroundColor: "rgba(255,255,255,0.10)",
		borderColor: "rgba(255,255,255,0.18)",
	},
	pillDisabled: { opacity: 0.6 },
	pillLabel: {
		fontSize: 12,
		fontWeight: "900",
		color: palette.textMuted,
	},
	pillLabelActive: {
		color: palette.textPrimary_1,
	},
	pillCount: {
		fontSize: 12,
		fontWeight: "900",
		color: palette.textPrimary_1,
	},
	syncRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingTop: 2,
		paddingHorizontal: 4,
	},
	syncText: {
		fontSize: 12,
		fontWeight: "800",
		color: palette.textMuted,
	},
});
