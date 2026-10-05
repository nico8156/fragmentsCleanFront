import {
	ActivityIndicator,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";
import type { useScanTicketScreenVM } from "@/app/adapters/secondary/viewModel/useScanTicketScreenVM";
import { FontAwesome } from "@expo/vector-icons";

export function ScanTicketContent({ vm }: { vm: ReturnType<typeof useScanTicketScreenVM> }) {
	const {
		imageUri,
		photoStatus,
		isProcessing,
		error,
		canSubmit,
		onPickImage,
		onSubmit,
	} = vm;

	const hasImage = Boolean(imageUri);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.header}>
				<Text accessibilityRole="header" style={styles.title}>Ton justificatif de visite</Text>

				<Text style={styles.subtitle}>
					Prends en photo ton ticket pour enregistrer ta visite et débloquer des récompenses.
				</Text>
			</View>

			<View style={styles.card}>
				<Pressable
					onPress={onPickImage}
					accessibilityRole="button"
					accessibilityLabel={hasImage ? "Reprendre la photo du ticket" : "Prendre une photo du ticket"}
					style={({ pressed }) => [
						styles.captureButton,
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.captureLabel}>
						{hasImage ? "Reprendre la photo" : "Prendre une photo"}
					</Text>
				</Pressable>

				{isProcessing && (
					<View style={styles.processing} accessibilityLiveRegion="polite">
						<ActivityIndicator size="small" color={palette.accent_1} />
						<Text style={styles.processingText}>
							Vérification de la photo…
						</Text>
					</View>
				)}

				{error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

				{imageUri && (
					<View style={styles.previewBlock}>
						<Image source={{ uri: imageUri }} style={styles.preview} accessibilityLabel="Aperçu du ticket" />

						{!isProcessing && (
							<View style={styles.statusRow}>
								{photoStatus === "ok" && (
									<>
										<FontAwesome name="check-circle" size={18} color={palette.success} />
										<Text style={styles.statusOk}>
											Photo lisible — prête à être envoyée
										</Text>
									</>
								)}

								{photoStatus === "bad" && (
									<>
										<FontAwesome name="exclamation-circle" size={18} color={palette.danger} />
										<Text style={styles.statusBad}>
											Photo difficile à lire — essaie de la reprendre
										</Text>
									</>
								)}
							</View>
						)}
					</View>
				)}
			</View>

			<Pressable
				onPress={onSubmit}
				disabled={!canSubmit}
				accessibilityRole="button"
				accessibilityState={{ disabled: !canSubmit, busy: isProcessing }}
				accessibilityLabel="Envoyer le ticket"
				style={({ pressed }) => [
					styles.submitButton,
					!canSubmit && styles.submitButtonDisabled,
					pressed && canSubmit && styles.pressed,
				]}
			>
				<Text style={styles.submitLabel}>Envoyer le ticket</Text>
			</Pressable>

			<Text style={styles.helpText}>
				Astuce : ticket bien à plat, photo nette et bien éclairée. Une photo lisible est nécessaire avant l’envoi.
			</Text>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: palette.background,
		padding: 20,
		gap: 16,
	},

	header: {
		gap: 8,
	},

	title: {
		fontSize: 26,
		fontWeight: "700",
		color: palette.textPrimary,
	},

	subtitle: {
		fontSize: 15,
		color: palette.textSecondary,
		lineHeight: 22,
	},

	card: {
		backgroundColor: palette.surface,
		borderRadius: 18,
		padding: 16,
		gap: 14,
	},

	captureButton: {
		minHeight: 44,
		backgroundColor: palette.background,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},

	captureLabel: {
		color: palette.accent_1,
		fontSize: 16,
		fontWeight: "600",
	},

	processing: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},

	processingText: {
		flex: 1,
		fontSize: 14,
		color: palette.textPrimary,
	},

	error: {
		color: palette.danger,
		fontSize: 14,
	},

	previewBlock: {
		gap: 10,
	},

	preview: {
		width: "100%",
		height: 220,
		borderRadius: 14,
	},

	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},

	statusOk: {
		flex: 1,
		fontSize: 14,
		color: palette.success,
		fontWeight: "600",
	},

	statusBad: {
		flex: 1,
		fontSize: 14,
		color: palette.danger,
		fontWeight: "600",
	},

	submitButton: {
		minHeight: 44,
		marginTop: 8,
		backgroundColor: palette.accent,
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
	},

	submitButtonDisabled: {
		backgroundColor: palette.bg_dark_30,
	},

	submitLabel: {
		color: palette.background,
		fontSize: 16,
		fontWeight: "700",
	},

	helpText: {
		fontSize: 13,
		color: palette.textSecondary,
		textAlign: "center",
		marginTop: 6,
	},

	pressed: {
		opacity: 0.8,
	},
});
