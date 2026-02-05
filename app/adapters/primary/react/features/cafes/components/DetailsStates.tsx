import { palette } from "@/app/adapters/primary/react/css/colors";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function DetailsSkeleton() {
	return (
		<SafeAreaView style={s.safe} edges={["top"]}>
			<View style={s.center}>
				<ActivityIndicator />
				<Text style={s.loadingText}>Chargement…</Text>
			</View>
		</SafeAreaView>
	);
}

export function DetailsError({ onBack }: { onBack: () => void }) {
	return (
		<SafeAreaView style={s.safe} edges={["top"]}>
			<View style={s.center}>
				<Text style={s.errorTitle}>Café introuvable</Text>
				<Text style={s.errorText}>Impossible de lire l’identifiant de ce café.</Text>
				<Pressable onPress={onBack} style={s.errorBtn}>
					<Text style={s.errorBtnText}>Retour</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const s = StyleSheet.create({
	safe: { flex: 1, backgroundColor: palette.background_1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
	loadingText: { marginTop: 10, color: palette.textMuted, fontWeight: "800" },

	errorTitle: { fontSize: 18, fontWeight: "900", color: palette.textPrimary_1 },
	errorText: { marginTop: 6, color: palette.textMuted, fontWeight: "700", textAlign: "center" },
	errorBtn: {
		marginTop: 14,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	errorBtnText: { fontWeight: "900", color: palette.textPrimary_1 },
});

