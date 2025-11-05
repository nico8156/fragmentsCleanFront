import { useMemo, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import { palette } from "@/app/adapters/primary/react/css/colors";
import CoffeeListItem from "@/app/adapters/primary/react/components/coffeeSelection/coffeeListItem";
import { CoffeeId, parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { RootStackNavigationProp } from "@/src/navigation/types";

export function SearchScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const inset = useSafeAreaInsets();
    const [query, setQuery] = useState("");

    const coffees = useSelector((state: RootStateWl) => state.cfState.ids.map((id) => state.cfState.byId[id]));

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return coffees.map((coffee) => coffee?.id).filter(Boolean) as (CoffeeId | string)[];
        }
        return coffees
            .filter((coffee) => {
                const name = coffee?.name?.toLowerCase() ?? "";
                const city = coffee?.address?.city?.toLowerCase() ?? "";
                return name.includes(normalized) || city.includes(normalized);
            })
            .map((coffee) => coffee?.id)
            .filter(Boolean) as (CoffeeId | string)[];
    }, [coffees, query]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <View style={[styles.header, { paddingTop: inset.top + 8 }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityRole="button">
                    <Ionicons name="chevron-back" size={22} color={palette.textPrimary} />
                </Pressable>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search" size={18} color={palette.textMuted} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Rechercher un café, une ville, un style"
                        placeholderTextColor={palette.textMuted}
                        style={styles.input}
                        autoFocus
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {query.length > 0 ? (
                        <Pressable onPress={() => setQuery("")} style={styles.clearButton} accessibilityRole="button">
                            <Ionicons name="close" size={18} color={palette.textMuted} />
                        </Pressable>
                    ) : null}
                </View>
            </View>

            <View style={styles.meta}>
                <Text style={styles.metaLabel}>Résultats</Text>
                <Text style={styles.metaValue}>{filtered.length}</Text>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => String(item)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <CoffeeListItem id={parseToCoffeeId(String(item))} />
                )}
                keyboardShouldPersistTaps="handled"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        paddingHorizontal: 20,
        gap: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(36, 27, 22, 0.8)",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.06)",
    },
    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 22,
        backgroundColor: palette.elevated,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    input: {
        flex: 1,
        color: palette.textPrimary,
        fontSize: 16,
    },
    clearButton: {
        padding: 4,
    },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    metaLabel: {
        color: palette.textMuted,
        fontSize: 13,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    metaValue: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: "700",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 140,
        gap: 16,
    },
});

export default SearchScreen;
