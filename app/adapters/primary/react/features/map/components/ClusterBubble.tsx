import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";

type ClusterBubbleProps = {
    count: number;
};

export const ClusterBubble = memo(({ count }: ClusterBubbleProps) => {
    // On évite d’afficher des nombres trop longs
    const label =
        count > 999 ? "999+" :
            count > 99 ? "99+"  :
                String(count);

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <Text style={styles.text}>{label}</Text>
            </View>
        </View>
    );
});

ClusterBubble.displayName = "ClusterBubble";

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    inner: {
        minWidth: 70,
        height: 70,
        borderRadius: 35,
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(12, 8, 6, 0.92)", // fond sombre type Fragments
        borderWidth: 2,
        borderColor: palette.accent,             // ta couleur d’accent
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    text: {
        color: palette.textPrimary,
        fontWeight: "700",
        fontSize: 14,
        letterSpacing: 0.4,
    },
});
