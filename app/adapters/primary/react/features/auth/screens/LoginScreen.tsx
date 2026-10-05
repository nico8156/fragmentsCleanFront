import { useCallback, useEffect, useState } from "react";
import { Image, NativeModules, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { ReleaseLegalLinks } from "@/app/adapters/primary/react/components/ReleaseLegalLinks";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { hasAppleButtonView } from "../appleButtonAvailability";

export function LoginScreen() {
	const { signInWithGoogle, signInWithApple, isLoading, error } = useAuthUser();
	const [appleAvailable, setAppleAvailable] = useState(false);
	useEffect(() => {
		let mounted = true;
		const expoRuntime = (globalThis as unknown as { expo?: { getViewConfig?: (name: string) => unknown } }).expo;
		const registered = hasAppleButtonView({
			getViewConfig: expoRuntime?.getViewConfig?.bind(expoRuntime),
			legacyView: NativeModules.NativeUnimoduleProxy?.viewManagersMetadata?.ExpoAppleAuthentication,
		});
		if (Platform.OS === "ios" && registered) {
			void AppleAuthentication.isAvailableAsync().then(available => {
				if (mounted) setAppleAvailable(available);
			}).catch(() => { if (mounted) setAppleAvailable(false); });
		}
		return () => { mounted = false; };
	}, []);

	const handlePress = useCallback(() => {
		signInWithGoogle();
	}, [signInWithGoogle]);

	return (
		<SafeAreaView style={styles.safe} testID="login-screen">
			<ScrollView contentContainerStyle={styles.container}>
				{/* Logo / identité */}
				<View style={styles.brandBlock}>
					<Image source={require("@/assets/images/icon.png")} style={styles.logoContainer} resizeMode="contain" accessible={false} />

					<Text style={styles.title}>Fragments</Text>

					<Text style={styles.tagline}>
						Ton carnet de cafés.
					</Text>
				</View>

				{/* Bouton principal */}
				<GoogleSignInButton onPress={handlePress} loading={isLoading} />

				{appleAvailable ? <AppleAuthentication.AppleAuthenticationButton
					testID="apple-sign-in"
					buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
					buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
					cornerRadius={12}
					style={styles.appleButton}
					onPress={() => { if (!isLoading) signInWithApple(); }}
				/> : null}

				{/* Gestion d’erreur propre */}
				{error ? (
					<Text accessibilityRole="alert" style={styles.error}>
						{error}
					</Text>
				) : null}

				{/* Mentions discrètes */}
				<View style={styles.legalBlock}>
					<Text style={styles.legal}>
						En continuant, tu acceptes les conditions d’utilisation et la politique de confidentialité.
					</Text>
					<ReleaseLegalLinks color="#d4d4d4" />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: palette.background,
	},

	container: {
		flexGrow: 1,
		paddingVertical: 24,
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

	logoContainer: { width: 112, height: 112 },

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

	appleButton: {
		width: "100%",
		height: 50,
	},

	error: {
		color: "#f87171",
		textAlign: "center",
		marginTop: 6,
	},

	legal: {
		fontSize: 12,
		color: palette.textSecondary,
		textAlign: "center",
		paddingHorizontal: 16,
	},
	legalBlock: {
		marginTop: 24,
		alignItems: "center",
	},
});

export default LoginScreen;
