import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";

interface ProfileCardProps {
    title: string;
    subtitle?: string;
    children?: ReactNode;
}

export function ProfileCard({ title, subtitle, children }: ProfileCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: palette.bg_dark_30,
        borderRadius: 20,
        padding: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    header: {
        gap: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: palette.textSecondary,
    },
});
