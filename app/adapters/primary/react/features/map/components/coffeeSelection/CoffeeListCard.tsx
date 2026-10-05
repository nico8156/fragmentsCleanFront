import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { radii, spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import type { CafeFullVM } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";

export function CoffeeListCard({ coffee, isOpen, distanceText, onPress }: {
    coffee: Pick<CafeFullVM, "name" | "address" | "photos">;
    isOpen?: boolean; distanceText?: string | null; onPress: () => void;
}) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={`Ouvrir la fiche de ${coffee.name}`} onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.details}>
                <Text style={styles.name} numberOfLines={2}>{coffee.name}</Text>
                {coffee.address.line1 ? <Text style={styles.address} numberOfLines={2}>{coffee.address.line1}</Text> : null}
                {coffee.address.city ? <Text style={styles.address}>{coffee.address.city}</Text> : null}
                <View style={styles.meta}>
                    <Text style={[styles.address, isOpen === true && styles.open]}>
                        {isOpen === undefined ? "Horaires à confirmer" : isOpen ? "Ouvert" : "Fermé"}
                    </Text>
                    {distanceText ? <Text style={styles.address}>{distanceText}</Text> : null}
                </View>
            </View>
            {coffee.photos[0] ? (
                <Image source={coffee.photos[0]} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" accessibilityLabel={`Photo de ${coffee.name}`} />
            ) : (
                <View style={styles.cover} accessible accessibilityLabel="Photo indisponible">
                    <SymbolView name="cup.and.saucer" size={24} tintColor={palette.textSecondary} fallback={<Text style={styles.address}>Café</Text>} />
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { flexDirection: "row", alignItems: "flex-start", gap: spacing.compact, paddingVertical: spacing.standard, minHeight: 44 },
    details: { flex: 1, minWidth: 0, gap: 4 },
    name: { ...typography.card, color: palette.textPrimary },
    address: { ...typography.body, color: palette.textSecondary },
    meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.compact, marginTop: 4 },
    open: { color: palette.success },
    cover: { width: 88, aspectRatio: 4 / 3, borderRadius: radii.control, backgroundColor: palette.surface, alignItems: "center", justifyContent: "center" },
    pressed: { opacity: 0.7 },
});
