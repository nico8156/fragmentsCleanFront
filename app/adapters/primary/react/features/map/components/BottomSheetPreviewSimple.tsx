import { palette } from "@/app/adapters/primary/react/css/colors";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
	name?: string;
	isOpen?: boolean;
	distanceText?: string;
	todayHoursLabel?: string; // ex: "08:30–18:00" ou "ferme à 18:00"
	onPressDetails: () => void;
};

export default function BottomSheetPreviewSimple({
	name,
	isOpen,
	distanceText,
	todayHoursLabel,
	onPressDetails,
}: Props) {
	const hasSelection = Boolean(name);

	const openLabel = useMemo(() => {
		if (!hasSelection) return "—";
		if (isOpen === undefined) return "Statut inconnu";
		return isOpen ? "OUVERT" : "FERMÉ";
	}, [hasSelection, isOpen]);

	const openSubLabel = useMemo(() => {
		if (!hasSelection) return "Tape un marker pour voir un spot";
		if (!todayHoursLabel) return "Horaires dans la fiche";
		// on garde simple et lisible
		return todayHoursLabel;
	}, [hasSelection, todayHoursLabel]);

	const distanceLabel = useMemo(() => {
		if (!hasSelection) return "—";
		return distanceText ?? "Distance inconnue";
	}, [hasSelection, distanceText]);

	// CTA “signature” : fun léger, pas cringe
	const ctaLabel = useMemo(() => {
		if (!hasSelection) return "Choisis un café";
		// si ouvert : incite à y aller maintenant
		if (isOpen) return "Let’s go ☕️";
		// si fermé : incite à découvrir quand même
		return "Découvrir quand même";
	}, [hasSelection, isOpen]);

	return (
		<View style={styles.container}>
			{/* Handle (simple + lisible) */}

			{/* NOM — très visible */}
			<Text style={styles.title} numberOfLines={1}>
				{name ?? "Sélectionnez un coffee shop"}
			</Text>

			{/* 2 colonnes : OUVERTURE / DISTANCE */}
			<View style={styles.grid}>
				<InfoBlock
					label="Ouverture"
					value={openLabel}
					subValue={openSubLabel}
					emphasis={isOpen ? "positive" : isOpen === false ? "negative" : "neutral"}
					disabled={!hasSelection}
				/>
				<InfoBlock
					label="Distance"
					value={distanceLabel}
					subValue={hasSelection ? "Depuis toi" : ""}
					emphasis="neutral"
					disabled={!hasSelection}
				/>
			</View>

			{/* CTA principal */}
			<Pressable
				onPress={onPressDetails}
				disabled={!hasSelection}
				style={({ pressed }) => [
					styles.cta,
					pressed && styles.ctaPressed,
					!hasSelection && styles.ctaDisabled,
				]}
			>
				<Text style={styles.ctaText}>{ctaLabel}</Text>
				<Text style={styles.ctaIcon}>→</Text>
			</Pressable>

			{/* Hint minimal */}
			<Text style={styles.hint}>Glisse pour fermer</Text>
		</View>
	);
}

function InfoBlock({
	label,
	value,
	subValue,
	emphasis,
	disabled,
}: {
	label: string;
	value: string;
	subValue?: string;
	emphasis: "positive" | "negative" | "neutral";
	disabled?: boolean;
}) {
	const toneStyle =
		emphasis === "positive"
			? styles.tonePositive
			: emphasis === "negative"
				? styles.toneNegative
				: styles.toneNeutral;

	return (
		<View style={[styles.block, toneStyle, disabled && styles.blockDisabled]}>
			<Text style={styles.blockLabel} numberOfLines={1}>
				{label}
			</Text>
			<Text style={styles.blockValue} numberOfLines={1}>
				{value}
			</Text>
			{subValue ? (
				<Text style={styles.blockSub} numberOfLines={1}>
					{subValue}
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 14,
		backgroundColor: palette.textPrimary_1,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		gap: 14,
	},

	handle: {
		alignSelf: "center",
		width: 78,
		height: 6,
		borderRadius: 99,
		backgroundColor: palette.border,
		opacity: 0.9,
	},

	title: {
		fontSize: 28, // plus grand = “confirmation”
		fontWeight: "900",
		color: palette.background_1,
		letterSpacing: -0.5,
	},

	grid: {
		flexDirection: "row",
		gap: 12,
	},

	block: {
		flex: 1,
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderWidth: 1,
	},

	// label petit, value gros : hiérarchie nette
	blockLabel: {
		fontSize: 12,
		fontWeight: "800",
		color: palette.textMuted,
		opacity: 0.95,
	},
	blockValue: {
		fontSize: 18,
		fontWeight: "900",
		color: palette.background_1,
		letterSpacing: 0.3,
		marginTop: 6,
	},
	blockSub: {
		fontSize: 12,
		fontWeight: "700",
		color: palette.background_30,
		marginTop: 4,
	},

	tonePositive: {
		backgroundColor: "rgba(46, 204, 113, 0.08)",
		borderColor: "rgba(46, 204, 113, 0.18)",
	},
	toneNegative: {
		backgroundColor: "rgba(231, 76, 60, 0.07)",
		borderColor: "rgba(231, 76, 60, 0.16)",
	},
	toneNeutral: {
		backgroundColor: "rgba(255,255,255,0.05)",
		borderColor: "rgba(255,255,255,0.10)",
	},
	blockDisabled: {
		opacity: 0.5,
	},

	cta: {
		height: 56,
		borderRadius: 18,
		backgroundColor: palette.accent,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 10,
	},
	ctaText: {
		fontSize: 16,
		fontWeight: "900",
		color: palette.textPrimary,
		letterSpacing: 0.2,
	},
	ctaIcon: {
		fontSize: 18,
		fontWeight: "900",
		color: palette.textPrimary,
		marginTop: -1,
	},
	ctaPressed: {
		opacity: 0.9,
		transform: [{ scale: 0.99 }],
	},
	ctaDisabled: {
		opacity: 0.45,
	},

	hint: {
		textAlign: "center",
		fontSize: 12,
		color: palette.textMuted,
		opacity: 0.9,
	},
});

