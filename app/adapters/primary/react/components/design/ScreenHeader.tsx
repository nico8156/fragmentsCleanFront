import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingIconButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";

export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <View style={styles.row}>
                {onBack ? (
                    <FloatingIconButton compact accessibilityLabel="Retour" onPress={onBack}>
                        <SymbolView name="chevron.left" size={18} tintColor={palette.textPrimary}
                            fallback={<Text style={styles.fallback}>{"‹"}</Text>} />
                    </FloatingIconButton>
                ) : null}
                <Text accessibilityRole="header" style={[styles.title, !onBack && styles.centered]}>{title}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { backgroundColor: palette.background },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.compact, paddingHorizontal: spacing.standard, paddingVertical: spacing.micro, minHeight: 60 },
    title: { ...typography.section, color: palette.textPrimary, flex: 1 },
    centered: { textAlign: "center" },
    fallback: { ...typography.section, color: palette.textPrimary },
});
