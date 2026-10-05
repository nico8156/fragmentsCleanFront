import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";
import { FloatingIconButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { typography } from "@/app/adapters/primary/react/css/designTokens";
import { palette } from "@/app/adapters/primary/react/css/colors";

export function CoffeeListHeader({ onMap }: { onMap: () => void }) {
    return <View style={styles.row}>
        <Text accessibilityRole="header" style={styles.title}>Tous les cafés</Text>
        <FloatingIconButton compact onPress={onMap} accessibilityLabel="Afficher la carte">
            <SymbolView name="map.fill" size={22} tintColor={palette.textPrimary} fallback={<Text style={styles.fallback}>↗</Text>} />
        </FloatingIconButton>
    </View>;
}
const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: { ...typography.screen, flex: 1, color: palette.textPrimary },
    fallback: { ...typography.section, color: palette.textPrimary },
});
