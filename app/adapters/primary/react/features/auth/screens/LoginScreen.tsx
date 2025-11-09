import { ActivityIndicator, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { signInWithProvider } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";
import { selectAuthError, selectAuthStatus } from "@/app/core-logic/contextWL/userWl/selector/user.selector";

export function LoginScreen() {
    const dispatch = useDispatch<any>();
    const status = useSelector(selectAuthStatus);
    const error = useSelector(selectAuthError);

    const loading = status === "loading";

    const handlePress = () => {
        if (loading) return;
        dispatch(signInWithProvider({ provider: "google", scopes: ["openid", "email", "profile"] }));
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Image
                    style={styles.logo}
                    source={{ uri: "https://cdn.simpleicons.org/google/4285F4" }}
                />
                <Text style={styles.title}>Connexion</Text>
                <Text style={styles.subtitle}>
                    Continue avec ton compte Google pour retrouver tes cafés préférés.
                </Text>
                <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handlePress}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Se connecter avec Google</Text>
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
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#fff",
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
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    error: {
        color: "#f87171",
        textAlign: "center",
    },
});

export default LoginScreen;
