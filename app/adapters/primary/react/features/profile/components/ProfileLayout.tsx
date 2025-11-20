import { ReactNode } from "react";
import {ScrollView, StyleSheet, View} from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";

interface ProfileLayoutProps {
    title: string;
    children: ReactNode;
}

export function ProfileLayout({ title, children }: ProfileLayoutProps) {
    return (
        <ScrollView style={styles.root}>
            <View style={styles.content}>{children}</View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: palette.bg_dark_90
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
