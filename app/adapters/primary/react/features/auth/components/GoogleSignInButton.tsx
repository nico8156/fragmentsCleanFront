import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

export function GoogleSignInButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
    return (
        <Pressable testID="google-sign-in" onPress={onPress} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Continuer avec Google"
            accessibilityState={{ disabled: loading, busy: loading }}
            style={({ pressed }) => [styles.button, (pressed || loading) && styles.dimmed]}>
            <View style={styles.content}>
                {loading ? <ActivityIndicator color="#1F1F1F" /> :
                    <Image source={require("@/assets/images/google-g.png")} style={styles.logo}
                        resizeMode="contain" accessible={false} />}
                <Text style={styles.label}>Continuer avec Google</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: { width: "100%", minHeight: 50, paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 12, backgroundColor: "#FFFFFF", justifyContent: "center" },
    content: { flexDirection: "row", alignItems: "center", gap: 12 },
    logo: { width: 20, height: 20 },
    label: { flex: 1, color: "#1F1F1F", fontSize: 16, lineHeight: 22, fontWeight: "500" },
    dimmed: { opacity: 0.65 },
});
