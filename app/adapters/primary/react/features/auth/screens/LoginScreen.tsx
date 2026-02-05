import { FontAwesome } from "@expo/vector-icons";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";

export function LoginScreen() {
	const { signInWithGoogle, isLoading, error } = useAuthUser();

	const handlePress = useCallback(() => {
		signInWithGoogle();
	}, [signInWithGoogle]);

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				{/* Logo / identité */}
				<View style={styles.brandBlock}>
					<View style={styles.logoContainer}>
						<FontAwesome name="coffee" size={36} color="#111" />
					</View>

					<Text style={styles.title}>Fragments</Text>

					<Text style={styles.tagline}>
						Sauvegarde tes cafés préférés et retrouve-les partout
					</Text>
				</View>

				{/* Bouton principal */}
				<Pressable
					onPress={handlePress}
					disabled={isLoading}
					style={({ pressed }) => [
						styles.googleButton,
						pressed && styles.pressed,
						isLoading && styles.disabled,
					]}
				>
					{isLoading ? (
						<ActivityIndicator color="#111" />
					) : (
						<View style={styles.googleContent}>
							<FontAwesome name="google" size={20} color="#111" />
							<Text style={styles.googleText}>
								Continuer avec Google
							</Text>
						</View>
					)}
				</Pressable>

				{/* Gestion d’erreur propre */}
				{error ? (
					<Text style={styles.error}>
						{error}
					</Text>
				) : null}

				{/* Alternative optionnelle */}
				<Pressable style={styles.skipButton}>
					<Text style={styles.skipText}>
						Continuer sans compte
					</Text>
				</Pressable>

				{/* Mentions discrètes */}
				<Text style={styles.legal}>
					En continuant, tu acceptes les conditions d’utilisation et la politique de confidentialité.
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: "#0a0a0a",
	},

	container: {
		flex: 1,
		paddingHorizontal: 24,
		justifyContent: "center",
		alignItems: "center",
		gap: 20,
	},

	brandBlock: {
		alignItems: "center",
		gap: 12,
		marginBottom: 24,
	},

	logoContainer: {
		width: 84,
		height: 84,
		borderRadius: 42,
		backgroundColor: "#ffffff",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},

	title: {
		fontSize: 30,
		fontWeight: "800",
		color: "#ffffff",
	},

	tagline: {
		fontSize: 16,
		textAlign: "center",
		color: "#d1d1d1",
		paddingHorizontal: 12,
	},

	googleButton: {
		width: "100%",
		paddingVertical: 14,
		borderRadius: 12,
		backgroundColor: "#ffffff",
		alignItems: "center",
	},

	googleContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},

	googleText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111111",
	},

	pressed: {
		opacity: 0.7,
	},

	disabled: {
		opacity: 0.6,
	},

	error: {
		color: "#f87171",
		textAlign: "center",
		marginTop: 6,
	},

	skipButton: {
		marginTop: 8,
		padding: 8,
	},

	skipText: {
		color: "#9ca3af",
		fontSize: 15,
	},

	legal: {
		position: "absolute",
		bottom: 20,
		fontSize: 12,
		color: "#6b7280",
		textAlign: "center",
		paddingHorizontal: 16,
	},
});

export default LoginScreen;

