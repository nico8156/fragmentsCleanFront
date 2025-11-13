import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";

interface ProfileLayoutProps {
    title: string;
    children: ReactNode;
}

export function ProfileLayout({ title, children }: ProfileLayoutProps) {
    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.content}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: palette.bg_dark_90,
    },
    header: {
        backgroundColor: palette.primary_50,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 12,
        paddingTop: 45,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: palette.text_90,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 16,
    },
});
