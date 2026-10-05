import { StyleSheet, Text } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { typography } from "@/app/adapters/primary/react/css/designTokens";

export function RootScreenTitle({ children }: { children: string }) {
    return <Text accessibilityRole="header" style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
    title: { ...typography.screen, color: palette.textPrimary, textAlign: "left", alignSelf: "flex-start" },
});
