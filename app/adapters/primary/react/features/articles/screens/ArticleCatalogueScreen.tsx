import { palette } from "@/app/adapters/primary/react/css/colors";
import type { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { useArticlesHome } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ArticleCatalogueScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const insets = useSafeAreaInsets();
    const { articles, refresh, isLoading, isError } = useArticlesHome();
    const goBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Tabs", { screen: "Home" });

    return <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
            <Pressable onPress={goBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Retour à l’accueil">
                <Ionicons name="chevron-back" size={20} color={palette.textPrimary} />
                <Text style={styles.backLabel}>Retour</Text>
            </Pressable>
            <Text style={styles.title}>Tous les articles</Text>
            <Text style={styles.intro}>Les histoires publiées par Fragments, de la plus récente à la plus ancienne.</Text>
        </View>
        <FlatList
            data={articles}
            keyExtractor={(article) => article.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            refreshing={isLoading}
            onRefresh={refresh}
            renderItem={({ item }) => <Pressable
                onPress={() => navigation.navigate("Article", { slug: item.slug })}
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={`Lire ${item.title}`}
            >
                <Image source={item.cover.url} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
                <View style={styles.copy}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.cardIntro} numberOfLines={2}>{item.intro}</Text>
                    {item.featuredRank !== null ? <Text style={styles.featured}>À la une</Text> : null}
                </View>
            </Pressable>}
            ListEmptyComponent={<Text style={styles.empty}>{isLoading ? "Chargement des articles…" : isError ? "Impossible de charger les articles. Tire vers le bas pour réessayer." : "Aucun article publié pour le moment."}</Text>}
        />
    </View>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: palette.background },
    header: { paddingHorizontal: 24, paddingBottom: 20, gap: 8 },
    back: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
    backLabel: { color: palette.textPrimary, fontWeight: "700" },
    title: { color: palette.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 8 },
    intro: { color: palette.textSecondary, lineHeight: 21 },
    list: { paddingHorizontal: 24, gap: 12 },
    card: { flexDirection: "row", minHeight: 116, overflow: "hidden", borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
    image: { width: 112, minHeight: 116, backgroundColor: palette.elevated },
    copy: { flex: 1, padding: 13, gap: 5 },
    cardTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: "800" },
    cardIntro: { color: palette.textSecondary, fontSize: 13, lineHeight: 18 },
    featured: { color: palette.accent, fontSize: 12, fontWeight: "800", marginTop: 3 },
    empty: { color: palette.textSecondary, lineHeight: 22, paddingVertical: 28 },
});
