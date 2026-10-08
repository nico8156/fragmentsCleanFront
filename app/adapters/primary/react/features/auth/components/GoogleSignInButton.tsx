import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

export function GoogleSignInButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
    return (
        <Pressable testID="google-sign-in" onPress={onPress} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Continuer avec Google"
            accessibilityState={{ disabled: loading, busy: loading }}
            style={({ pressed }) => [styles.button, (pressed || loading) && styles.dimmed]}>
            <View style={styles.content}>
                {loading ? <ActivityIndicator color="#000000" style={styles.logo} /> :
                    <Image source={require("@/assets/images/google-g.png")} style={styles.logo}
                        resizeMode="contain" accessible={false} />}
                <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Continuer avec Google</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: { width: "100%", minHeight: 50, paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 12, backgroundColor: "#FFFFFF", justifyContent: "center" },
    content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
    logo: { width: 20, height: 20 },
    label: { flexShrink: 1, textAlign: "center", color: "#000000", fontSize: 21.5, lineHeight: 26, fontWeight: "500" },
    dimmed: { opacity: 0.65 },
});
