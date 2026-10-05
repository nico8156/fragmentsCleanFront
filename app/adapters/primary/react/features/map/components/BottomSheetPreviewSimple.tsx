import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ContentState, FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { spacing, surfaces, typography } from "@/app/adapters/primary/react/css/designTokens";

type Props = {
	name?: string;
	isOpen?: boolean;
	distanceText?: string;
	todayHoursLabel?: string;
	onPressDetails: () => void;
	onPressDirections: () => void;
	canOpenDirections: boolean;
	isLoading?: boolean;
};

export default function BottomSheetPreviewSimple({
	name, isOpen, distanceText, todayHoursLabel, onPressDetails, onPressDirections, canOpenDirections, isLoading = false,
}: Props) {
	const hasSelection = Boolean(name);
	const openLabel = !hasSelection ? "—" : isOpen === undefined ? "Statut inconnu" : isOpen ? "Ouvert" : "Fermé";
	return (
		<View style={styles.container}>
			<Text style={styles.title} accessibilityRole="header">{name ?? "Sélectionnez un coffee shop"}</Text>
			<View style={styles.grid}>
				<View style={styles.info}>
					<Text style={styles.meta}>Ouverture</Text>
					<Text style={styles.value}>{openLabel}</Text>
					<Text style={styles.meta}>{!hasSelection ? "Tape un marker pour voir un spot" : todayHoursLabel || "Horaires dans la fiche"}</Text>
				</View>
				<View style={styles.info}>
					<Text style={styles.meta}>Distance</Text>
					<Text style={styles.value}>{!hasSelection ? "—" : distanceText ?? "Distance inconnue"}</Text>
					{hasSelection ? <Text style={styles.meta}>Depuis toi</Text> : null}
				</View>
			</View>
			{isLoading ? <ContentState kind="loading" tone="light" message="Chargement du café…" /> : null}
			<View style={styles.actions}>
				<FragmentsButton label="Voir la fiche" accessibilityLabel="Voir la fiche du café" onPress={onPressDetails}
					disabled={!hasSelection || isLoading} tone="light" style={styles.primaryAction} />
				<FragmentsButton label="Itinéraire" accessibilityLabel="Ouvrir l’itinéraire" onPress={onPressDirections}
					disabled={!canOpenDirections || isLoading} tone="light" variant="secondary" style={styles.secondaryAction} />
			</View>
			<Text style={[styles.meta, styles.hint]}>Glisse pour fermer</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { paddingHorizontal: spacing.section, paddingTop: spacing.micro, paddingBottom: spacing.standard, gap: spacing.section },
	title: { ...typography.screen, color: surfaces.previewText },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.standard },
	info: { flexGrow: 1, flexBasis: 130, gap: spacing.micro },
	value: { ...typography.card, color: surfaces.previewText },
	meta: { ...typography.body, color: surfaces.previewSecondary },
	actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.compact },
	primaryAction: { flexGrow: 1, flexBasis: 170 },
	secondaryAction: { flexGrow: 1, flexBasis: 110 },
	hint: { textAlign: "center" },
});
