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
import { useScanTicketScreenVM } from "@/app/adapters/secondary/viewModel/useScanTicketScreenVM";
import { FontAwesome } from "@expo/vector-icons";

export function ScanTicketScreen() {
	const {
		imageUri,
		photoStatus,
		isProcessing,
		error,
		canSubmit,
		onPickImage,
		onSubmit,
	} = useScanTicketScreenVM();

	const hasImage = Boolean(imageUri);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Scanner un ticket</Text>

				<Text style={styles.subtitle}>
					Prends en photo ton ticket pour enregistrer ta visite et débloquer des récompenses.
				</Text>
			</View>

			<View style={styles.card}>
				<Pressable
					onPress={onPickImage}
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
					<View style={styles.processing}>
						<ActivityIndicator size="small" color={palette.accent_1} />
						<Text style={styles.processingText}>
							Vérification de la photo…
						</Text>
					</View>
				)}

				{error && <Text style={styles.error}>{error}</Text>}

				{hasImage && (
					<View style={styles.previewBlock}>
						<Image source={{ uri: imageUri }} style={styles.preview} />

						{!isProcessing && (
							<View style={styles.statusRow}>
								{photoStatus === "ok" && (
									<>
										<FontAwesome name="check-circle" size={18} color="#0E7A2E" />
										<Text style={styles.statusOk}>
											Photo lisible — prête à être envoyée
										</Text>
									</>
								)}

								{photoStatus === "bad" && (
									<>
										<FontAwesome name="exclamation-circle" size={18} color="#B3261E" />
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
				style={({ pressed }) => [
					styles.submitButton,
					!canSubmit && styles.submitButtonDisabled,
					pressed && canSubmit && styles.pressed,
				]}
			>
				<Text style={styles.submitLabel}>Envoyer le ticket</Text>
			</Pressable>

			<Text style={styles.helpText}>
				Astuce : ticket bien à plat, photo nette et bien éclairée.
			</Text>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: palette.bg_light_90,
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
		backgroundColor: palette.bg_dark_10,
		borderRadius: 18,
		padding: 16,
		gap: 14,
		borderWidth: 1,
		borderColor: palette.border,
	},

	captureButton: {
		backgroundColor: palette.bg_light_90,
		paddingVertical: 14,
		borderRadius: 24,
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
		fontSize: 14,
		color: palette.textPrimary,
	},

	error: {
		color: "#B00020",
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
		fontSize: 14,
		color: "#0E7A2E",
		fontWeight: "600",
	},

	statusBad: {
		fontSize: 14,
		color: "#B3261E",
		fontWeight: "600",
	},

	submitButton: {
		marginTop: 8,
		backgroundColor: palette.accent,
		borderRadius: 24,
		paddingVertical: 16,
		alignItems: "center",
	},

	submitButtonDisabled: {
		backgroundColor: palette.bg_dark_30,
	},

	submitLabel: {
		color: "#ffffff",
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

export default ScanTicketScreen;
