import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import type { CoffeeDiscoverySort } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

type DiscoveryViewModel = {
    coffees: Array<{ tags: string[] }>;
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
            {discovery.isUsingCachedCatalogue && <Text style={styles.cacheNotice}>Connexion indisponible : résultats du cache local.</Text>}
            <TextInput
                value={discovery.preferences.query}
                onChangeText={discovery.setQuery}
                placeholder="Café, ville ou caractéristique"
                placeholderTextColor={palette.textMuted}
                style={styles.search}
                accessibilityLabel="Rechercher un café ou une ville"
            />
            <View style={styles.switchRow}>
                <Text style={styles.label}>Ouverts maintenant</Text>
                <Switch value={discovery.preferences.onlyOpenNow} onValueChange={discovery.setOnlyOpenNow} />
                <Text style={styles.label}>Avec photos</Text>
                <Switch value={discovery.preferences.onlyWithPhotos} onValueChange={discovery.setOnlyWithPhotos} />
            </View>
            <View style={styles.chips}>
                {(["distance", "relevance"] as CoffeeDiscoverySort[]).map((sort) => (
                    <Pressable key={sort} onPress={() => discovery.setSort(sort)} style={[styles.chip, discovery.preferences.sort === sort && styles.chipSelected]}>
                        <Text style={[styles.chipText, discovery.preferences.sort === sort && styles.chipTextSelected]}>
                            {sort === "distance" ? (discovery.hasLocation ? "Distance" : "Nom") : "Pertinence"}
                        </Text>
                    </Pressable>
                ))}
                {tags.map((tag) => <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.chip, discovery.preferences.requiredTags.includes(tag) && styles.chipSelected]}>
                    <Text style={[styles.chipText, discovery.preferences.requiredTags.includes(tag) && styles.chipTextSelected]}>#{tag}</Text>
                </Pressable>)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 10 },
    cacheNotice: { color: palette.textMuted, fontSize: 12 },
    search: { backgroundColor: palette.elevated, borderColor: palette.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: palette.textPrimary },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    label: { color: palette.textSecondary, fontSize: 13 },
    chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    chip: { borderWidth: 1, borderColor: palette.border, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
    chipSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
    chipText: { color: palette.textSecondary, fontSize: 12, fontWeight: "600" },
    chipTextSelected: { color: palette.background }
});
