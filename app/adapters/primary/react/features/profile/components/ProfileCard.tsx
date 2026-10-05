import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
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
                <Text accessibilityRole="header" style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { paddingVertical: spacing.micro, gap: spacing.compact },
    header: { gap: spacing.micro },
    title: { ...typography.section, color: palette.textPrimary },
    subtitle: { ...typography.body, color: palette.textSecondary },
});
