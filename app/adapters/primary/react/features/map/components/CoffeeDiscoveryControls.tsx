import { ContentState } from "@/app/adapters/primary/react/components/design/Primitives";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import type { CoffeeDiscoverySort } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

type DiscoveryViewModel = {
    coffees: { tags: string[] }[];
    preferences: { query: string; onlyOpenNow: boolean; onlyWithPhotos: boolean; requiredTags: string[]; sort: CoffeeDiscoverySort };
    hasLocation: boolean;
    isUsingCachedCatalogue?: boolean;
    setQuery(query: string): void;
    setOnlyOpenNow(enabled: boolean): void;
    setOnlyWithPhotos(enabled: boolean): void;
    setRequiredTags(tags: string[]): void;
    setSort(sort: CoffeeDiscoverySort): void;
};

export function CoffeeDiscoveryControls({ discovery }: { discovery: DiscoveryViewModel }) {
    const tags = [...new Set(discovery.coffees.flatMap((coffee) => coffee.tags))].sort((a, b) => a.localeCompare(b, "fr"));
    const toggleTag = (tag: string) => {
        const selected = discovery.preferences.requiredTags;
        discovery.setRequiredTags(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag]);
    };
    return (
        <View style={styles.container} accessibilityLabel="Filtres de découverte">
            {discovery.isUsingCachedCatalogue && <ContentState kind="stale" message="Connexion indisponible : cafés enregistrés affichés." />}
            <TextInput
                value={discovery.preferences.query}
                onChangeText={discovery.setQuery}
                placeholder="Café, ville ou caractéristique"
                placeholderTextColor={palette.textMuted}
                style={styles.search}
                accessibilityLabel="Rechercher un café ou une ville"
            />
            <View style={styles.switchRow}>
                <View style={styles.toggle}>
                    <Text style={styles.label}>Ouverts maintenant</Text>
                    <Switch style={styles.switchControl} accessibilityLabel="Ouverts maintenant" value={discovery.preferences.onlyOpenNow} onValueChange={discovery.setOnlyOpenNow} trackColor={{ true: palette.accent }} />
                </View>
                <View style={styles.toggle}>
                    <Text style={styles.label}>Avec photos</Text>
                    <Switch style={styles.switchControl} accessibilityLabel="Avec photos" value={discovery.preferences.onlyWithPhotos} onValueChange={discovery.setOnlyWithPhotos} trackColor={{ true: palette.accent }} />
                </View>
            </View>
            <View style={styles.chips}>
                {(["distance", "relevance"] as CoffeeDiscoverySort[]).map((sort) => (
                    <Pressable key={sort} accessibilityRole="button" accessibilityLabel={`Trier par ${sort === "distance" ? (discovery.hasLocation ? "distance" : "nom") : "pertinence"}`} accessibilityState={{ selected: discovery.preferences.sort === sort }} onPress={() => discovery.setSort(sort)} style={[styles.chip, discovery.preferences.sort === sort && styles.chipSelected]}>
                        <Text style={[styles.chipText, discovery.preferences.sort === sort && styles.chipTextSelected]}>
                            {sort === "distance" ? (discovery.hasLocation ? "Distance" : "Nom") : "Pertinence"}
                        </Text>
                    </Pressable>
                ))}
                {tags.map((tag) => <Pressable key={tag} accessibilityRole="button" accessibilityLabel={tagLabel(tag)} accessibilityState={{ selected: discovery.preferences.requiredTags.includes(tag) }} onPress={() => toggleTag(tag)} style={[styles.chip, discovery.preferences.requiredTags.includes(tag) && styles.chipSelected]}>
                    <Text style={[styles.chipText, discovery.preferences.requiredTags.includes(tag) && styles.chipTextSelected]}>{tagLabel(tag)}</Text>
                </Pressable>)}
            </View>
        </View>
    );
}

// Display copy only: the stored filter key and callback payload stay unchanged.
const tagLabel = (tag: string) => tag === "google-places" ? "Référencés sur Google" : tag;

const styles = StyleSheet.create({
    container: { gap: 10 },
    search: { minHeight: 44, backgroundColor: palette.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: palette.textPrimary },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    toggle: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    switchControl: { minHeight: 44, minWidth: 44 },
    label: { color: palette.textSecondary, fontSize: 14 },
    chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    chip: { minHeight: 44, justifyContent: "center", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
    chipSelected: { backgroundColor: palette.surface },
    chipText: { color: palette.textSecondary, fontSize: 14 },
    chipTextSelected: { color: palette.textPrimary, fontWeight: "600" }
});
