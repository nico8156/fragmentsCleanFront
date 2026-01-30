import { palette } from "@/app/adapters/primary/react/css/colors";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
	name?: string;
	isOpen?: boolean;
	distanceText?: string;
	todayHoursLabel?: string;
	onPressDetails: () => void;
};

export default function BottomSheetPreviewSimple({
	name,
	isOpen,
	distanceText,
	todayHoursLabel,
	onPressDetails,
}: Props) {
	const statusLabel = useMemo(() => (isOpen ? "Ouvert" : "Fermé"), [isOpen]);

	return (
		<View style={styles.container}>
			<View style={styles.handle} />

			<Text style={styles.title} numberOfLines={1}>
				{name ?? "Sélectionnez un café"}
			</Text>

			<Text style={styles.meta} numberOfLines={1}>
				{statusLabel}
				{distanceText ? ` • ${distanceText}` : ""}
			</Text>

			{todayHoursLabel ? (
				<Text style={styles.subMeta} numberOfLines={1}>
					Aujourd’hui : {todayHoursLabel}
				</Text>
			) : null}

			<Pressable style={styles.cta} onPress={onPressDetails}>
				<Text style={styles.ctaText}>Voir la fiche</Text>
			</Pressable>

			<Text style={styles.hint}>Glissez vers le bas pour fermer</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingTop: 10,
		paddingBottom: 14,
		backgroundColor: palette.textPrimary_1,
		gap: 10,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: palette.border,
		opacity: 0.8,
	},
	title: {
		fontSize: 22,
		fontWeight: "800",
		color: palette.background_1,
	},
	meta: {
		fontSize: 13,
		color: palette.background_30,
	},
	subMeta: {
		fontSize: 12,
		color: palette.textMuted,
	},
	cta: {
		height: 52,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: palette.accent, // tu ajusteras
		marginTop: 2,
	},
	ctaText: {
		color: palette.textPrimary,
		fontWeight: "900",
		fontSize: 16,
	},
	hint: {
		textAlign: "center",
		color: palette.textMuted,
		fontSize: 12,
	},
});

