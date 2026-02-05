import { palette } from "@/app/adapters/primary/react/css/colors";
import { SymbolView } from "expo-symbols";
import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

export function DetailsHeroCard({
	coffee,
	addressLine,
	status,
	likes,
	commentCount,
	onPressLike,
	onPressComments,
}: {
	coffee: any;
	addressLine: string;
	status: { label: string; value: string };
	likes: {
		count: number;
		likedByMe: boolean;
		isOptimistic: boolean;
		isRefreshing: boolean;
	};
	commentCount: number;
	onPressLike: () => void;
	onPressComments: () => void;
}) {
	const brandLabel: string | undefined = (coffee as any).brandLabel;
	const logoUri: string | undefined = (coffee as any).logoUri;

	const isOpenNow: boolean | undefined = (coffee as any).isOpenNow; // optional, not required
	const openFlag = typeof isOpenNow === "boolean" ? isOpenNow : undefined;

	const showSync = Boolean(likes.isOptimistic || likes.isRefreshing);

	return (
		<View style={s.heroCard}>
			<View style={s.heroTop}>
				<View style={s.heroLeft}>
					<View style={s.logoWrap}>
						{logoUri ? (
							<Image source={{ uri: logoUri }} style={s.logo} />
						) : (
							<View style={s.logoPlaceholder}>
								<Text style={s.logoPlaceholderText}>☕️</Text>
							</View>
						)}
					</View>

					<View style={{ flex: 1, gap: 4 }}>
						{!!brandLabel ? <Text style={s.brandLabel}>{brandLabel.toUpperCase()}</Text> : null}
						<Text style={s.title} numberOfLines={2}>
							{coffee.name}
						</Text>
						{!!addressLine ? (
							<Text style={s.subtitle} numberOfLines={2}>
								{addressLine}
							</Text>
						) : null}
					</View>
				</View>

				<View style={s.metrics}>
					<Pressable onPress={onPressLike} style={s.metric}>
						<SymbolView
							name={likes.likedByMe ? "heart.fill" : "heart"}
							size={18}
							tintColor={likes.likedByMe ? "#E74C3C" : palette.textMuted}
							fallback={<Text>♥</Text>}
						/>
						<Text style={s.metricText}>{likes.count}</Text>
					</Pressable>

					<Pressable onPress={onPressComments} style={s.metric}>
						<SymbolView name="bubble.left.fill" size={18} tintColor={palette.textMuted} fallback={<Text>💬</Text>} />
						<Text style={s.metricText}>{commentCount}</Text>
					</Pressable>
				</View>
			</View>

			<View style={s.statusRow}>
				<View style={[s.statusBadge, openFlag === false ? s.statusClosed : s.statusOpen]}>
					<Text style={s.statusBadgeText}>{status.label}</Text>
				</View>
				<Text style={s.statusText} numberOfLines={1}>
					{status.value}
				</Text>

				{showSync ? (
					<View style={s.pill}>
						<ActivityIndicator size="small" />
						<Text style={s.pillText}>Sync…</Text>
					</View>
				) : null}
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	heroCard: {
		marginHorizontal: 16,
		marginTop: 10,
		borderRadius: 22,
		padding: 14,
		backgroundColor: "rgba(0,0,0,0.03)",
		gap: 12,
	},
	heroTop: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 12,
	},
	heroLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },

	logoWrap: { width: 46, height: 46, borderRadius: 23, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.06)" },
	logo: { width: 46, height: 46 },
	logoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
	logoPlaceholderText: { fontSize: 18 },

	brandLabel: { fontSize: 12, fontWeight: "900", color: "#7DB6FF", letterSpacing: 1 },
	title: { fontSize: 24, fontWeight: "900", color: palette.textPrimary_1, letterSpacing: -0.4 },
	subtitle: { fontSize: 13, fontWeight: "700", color: palette.textMuted, marginTop: 2 },

	metrics: { flexDirection: "row", gap: 14, alignItems: "center" },
	metric: { flexDirection: "row", alignItems: "center", gap: 6 },
	metricText: { fontSize: 14, fontWeight: "900", color: palette.textPrimary_1 },

	statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
	statusOpen: { backgroundColor: "rgba(76, 175, 80, 0.18)" },
	statusClosed: { backgroundColor: "rgba(231, 76, 60, 0.16)" },
	statusBadgeText: { fontSize: 12, fontWeight: "900", color: palette.textPrimary_1, letterSpacing: 0.8 },
	statusText: { flex: 1, fontSize: 13, fontWeight: "800", color: palette.textPrimary_1, opacity: 0.85 },

	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	pillText: { fontSize: 12, fontWeight: "900", color: palette.textMuted },
});

