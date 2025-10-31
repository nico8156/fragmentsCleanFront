import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { palette } from "@/constants/colors";

type Props = {
    onPress: () => void;
    insetBottom?: number;
};

export const ScanTicketFab = memo(({ onPress, insetBottom = 0 }: Props) => {
    const bottom = 32 + insetBottom;
    return (
        <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.wrapper]}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.button,
                    {
                        bottom,
                        opacity: pressed ? 0.85 : 1,
                    },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Scanner un ticket"
            >
                <MaterialIcons name="document-scanner" size={24} color="#1C0E08" />
                <Text style={styles.label}>Scanner</Text>
            </Pressable>
        </View>
    );
});

ScanTicketFab.displayName = "ScanTicketFab";

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: "flex-end",
        alignItems: "center",
    },
    button: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        backgroundColor: palette.accent,
        paddingHorizontal: 28,
        paddingVertical: Platform.select({ ios: 14, default: 12 }),
        borderRadius: 32,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    label: {
        color: "#1C0E08",
        fontWeight: "600",
        fontSize: 16,
    },
});
