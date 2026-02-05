import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";

export function ScanTicketSuccessScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();

	const goToTickets = () => {
		navigation.navigate("Tabs", {
			screen: "Profile",
			params: {
				screen: "Tickets",
			},
		});
	};

	const goToPass = () => {
		navigation.navigate("Tabs", {
			screen: "Rewards",
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.iconContainer}>
					<FontAwesome name="check" size={42} color="#0E7A2E" />
				</View>

				<Text style={styles.title}>Ticket envoyé</Text>

				<Text style={styles.subtitle}>
					Ton justificatif a bien été transmis.
					Il est maintenant en cours d’analyse.
				</Text>
			</View>

			<View style={styles.actions}>
				<Pressable
					onPress={goToTickets}
					style={({ pressed }) => [
						styles.primaryButton,
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.primaryLabel}>Voir mes tickets</Text>
				</Pressable>

				<Pressable
					onPress={goToPass}
					style={({ pressed }) => [
						styles.secondaryButton,
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.secondaryLabel}>Retour au Pass</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: palette.bg_light_90,
		padding: 24,
		justifyContent: "space-between",
	},

	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 16,
	},

	iconContainer: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: "#E6F6EC",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},

	title: {
		fontSize: 24,
		fontWeight: "700",
		color: palette.textPrimary,
	},

	subtitle: {
		fontSize: 15,
		color: palette.textSecondary,
		textAlign: "center",
		lineHeight: 22,
		paddingHorizontal: 12,
	},

	actions: {
		gap: 12,
	},

	primaryButton: {
		backgroundColor: palette.accent,
		paddingVertical: 16,
		borderRadius: 24,
		alignItems: "center",
	},

	primaryLabel: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "700",
	},

	secondaryButton: {
		backgroundColor: palette.bg_dark_10,
		paddingVertical: 16,
		borderRadius: 24,
		alignItems: "center",
		borderWidth: 1,
		borderColor: palette.border,
	},

	secondaryLabel: {
		color: palette.textPrimary,
		fontSize: 16,
		fontWeight: "600",
	},

	pressed: {
		opacity: 0.8,
	},
});

export default ScanTicketSuccessScreen;

