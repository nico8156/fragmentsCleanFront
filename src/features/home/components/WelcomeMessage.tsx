import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { palette } from "@/constants/colors";

export function WelcomeMessage() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bienvenue dans l’univers caféiné</Text>
            <Text style={styles.paragraph}>
                Découvre les maisons de torréfaction, les coffee-shops de caractère et les baristas passionnés près de toi.
            </Text>
            <View style={styles.row}>
                <MaterialIcons name="document-scanner" size={22} color={palette.accent} />
                <View style={styles.rowText}>
                    <Text style={styles.highlight}>Scanne ton ticket</Text>
                    <Text style={styles.caption}>Transforme chaque dégustation en badge et avantages exclusifs.</Text>
                </View>
            </View>
            <View style={styles.row}>
                <MaterialIcons name="local-cafe" size={22} color={palette.accent} />
                <View style={styles.rowText}>
                    <Text style={styles.highlight}>Explore les pépites locales</Text>
                    <Text style={styles.caption}>Une carte curatée pour voyager de tasse en tasse.</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: palette.elevated,
        borderRadius: 28,
        padding: 28,
        marginHorizontal: 24,
        marginBottom: 80,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        gap: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: palette.textPrimary,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: palette.textSecondary,
    },
    highlight: {
        fontWeight: "700",
        color: palette.textPrimary,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
    },
    rowText: {
        flex: 1,
        gap: 6,
    },
    caption: {
        fontSize: 13,
        lineHeight: 20,
        color: palette.textMuted,
    },
});
