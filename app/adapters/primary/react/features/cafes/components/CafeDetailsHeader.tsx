import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import { FloatingIconButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { HeartIcon } from "./HeartIcon";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Sync = { state: "pending" | "acked" | "failed"; untilMs: number } | null;
const syncLabel = (sync: Sync) => sync?.state === "pending" ? "Envoi…" : sync?.state === "acked" ? "Envoyé" : sync?.state === "failed" ? "Échec" : undefined;

export function CafeDetailsHeader({ title, statusLabel, likeCount, likedByMe, likeSync, commentCount, commentSync, onBack, onPressLike, onPressComments }: {
	title: string; statusLabel: string; likeCount: number; likedByMe: boolean; likeSync: Sync;
	commentCount: number; commentSync: Sync; onBack: () => void; onPressLike: () => void; onPressComments: () => void;
}) {
	return <View style={s.wrap}>
		<View style={s.topRow}>
			<FloatingIconButton compact accessibilityLabel="Retour" onPress={onBack}>
				<SymbolView name="chevron.left" size={18} tintColor={palette.textPrimary} fallback={<Text style={s.status}>{"‹"}</Text>} />
			</FloatingIconButton>
			<Text style={s.title} accessibilityRole="header">{title}</Text>
		</View>
		<View style={s.bottomRow}>
			<Text style={s.status}>{statusLabel === "OUVERT" ? "Ouvert" : statusLabel === "FERMÉ" ? "Fermé" : "Horaires à confirmer"}</Text>
			<View style={s.actions}>
				<Pressable accessibilityRole="button" accessibilityLabel={`${likedByMe ? "Retirer mon j’aime" : "J’aime"}, ${likeCount}`}
					accessibilityState={{ selected: likedByMe, busy: likeSync?.state === "pending" }} accessibilityValue={{ text: syncLabel(likeSync) }}
					onPress={onPressLike} style={s.metric}>
					<HeartIcon filled={likedByMe} size={18} color={likedByMe ? palette.accent : palette.textSecondary} />
					<Text style={s.status}>{likeCount}</Text>
					{likeSync ? <Text accessibilityLiveRegion="polite" style={s.sync}>{syncLabel(likeSync)}</Text> : null}
				</Pressable>
				<Pressable accessibilityRole="button" accessibilityLabel={`Commentaires, ${commentCount}`} accessibilityValue={{ text: syncLabel(commentSync) }}
					onPress={onPressComments} style={s.metric}>
					<SymbolView name="bubble.left" size={18} tintColor={palette.textSecondary} fallback={<Text style={s.status}>💬</Text>} />
					<Text style={s.status}>{commentCount}</Text>
					{commentSync ? <Text accessibilityLiveRegion="polite" style={s.sync}>{syncLabel(commentSync)}</Text> : null}
				</Pressable>
			</View>
		</View>
	</View>;
}

const s = StyleSheet.create({
	wrap: { paddingHorizontal: spacing.standard, paddingTop: spacing.micro, paddingBottom: 4, gap: spacing.micro },
	topRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.compact },
	title: { ...typography.section, color: palette.textPrimary, flex: 1, paddingTop: spacing.micro },
	bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.micro },
	status: { ...typography.body, color: palette.textSecondary },
	actions: { flexShrink: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.standard },
	metric: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
	sync: { ...typography.body, color: palette.textMuted },
});
