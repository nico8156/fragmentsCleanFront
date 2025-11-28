import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { FontAwesome } from "@expo/vector-icons";

import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";

export function LoginScreen() {
    const { signInWithGoogle, isLoading, error } = useAuthUser();

    const handlePress = useCallback(() => {
        signInWithGoogle();
    }, [signInWithGoogle]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <FontAwesome name="exclamation" size={24} color="black" />
                </View>
                <Text style={styles.title}>Connexion</Text>
                <Text style={styles.subtitle}>
                    Continue avec ton compte Google pour retrouver tes cafés préférés.
                </Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                        isLoading && styles.buttonDisabled,
                    ]}
                    onPress={handlePress}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>Se connecter avec</Text>
                            <View style={styles.googleLabel}>
                                <Text style={styles.googleText}>Google</Text>
                                <FontAwesome name="google" size={24} color="black" />
                            </View>
                        </View>
                    )}
                </Pressable>
                {error ? <Text style={styles.error}>{error}</Text> : null}
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
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 24,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#fff",
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        color: "#d1d1d1",
    },
    button: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#4285F4",
        alignItems: "center",
    },
    buttonPressed: {
        opacity: 0.7,
    },
    buttonDisabled: {
        opacity: 0.8,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    googleLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#fff",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    googleText: {
        fontWeight: "700",
        color: "#1a1a1a",
        fontSize: 16,
    },
    error: {
        color: "#f87171",
        textAlign: "center",
    },
});

export default LoginScreen;
