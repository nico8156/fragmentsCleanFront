import { memo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { HomeCategoryItemVM, HomeCategoryVM } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { palette } from "@/app/adapters/primary/react/css/colors";

type Props = {
    categories: HomeCategoryVM[];
    onSelect: (slug: string) => void;
};

const CategoryItem = memo(({ item, onSelect }: { item: HomeCategoryItemVM; onSelect: (slug: string) => void }) => (
    <Pressable style={styles.itemContainer} onPress={() => onSelect(item.slug)}>
        <View style={styles.logoWrapper}>
            <Image
                source={{ uri: item.image.url }}
                style={styles.logo}
                contentFit="cover"
                cachePolicy="memory-disk"
            />
        </View>
        <Text numberOfLines={2} style={styles.itemTitle}>
            {item.name}
        </Text>
    </Pressable>
));

CategoryItem.displayName = "CategoryItem";

export function Categories({ categories, onSelect }: Props) {
    if (!categories.length) {
        return null;
    }

    return (
        <View style={styles.container}>
            {categories.map((category, index) => (
                <View key={category.id} style={[styles.categoryBlock, index === categories.length - 1 ? undefined : styles.categorySpacing]}>
                    <View style={styles.categoryHeader}>
                        <Text style={styles.categoryTitle}>{category.title}</Text>
                        <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                    </View>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={category.items}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <CategoryItem item={item} onSelect={onSelect} />}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 32,
    },
    categoryBlock: {
        gap: 20,
    },
    categorySpacing: {
        marginTop: 32,
    },
    categoryHeader: {
        marginBottom: 4,
        gap: 6,
    },
    categoryTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: palette.accent,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    categorySubtitle: {
        color: palette.textMuted,
        fontSize: 14,
        lineHeight: 18,
    },
    listContent: {
        paddingRight: 16,
        gap: 16,
    },
    separator: {
        width: 2,
    },
    itemContainer: {
        width: 132,
        height: 180,
        padding: 5,
        alignItems: "center",
        backgroundColor: palette.elevated,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        gap: 12,
    },
    logoWrapper: {
        width: "100%",
        height: 92,
        overflow: "hidden",
        backgroundColor: palette.surface,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.06)",
    },
    logo: {
        width: "100%",
        height: "100%",
    },
    itemTitle: {
        fontSize: 14,
        lineHeight: 18,
        color: palette.textPrimary,
        fontWeight: "600",
    },
});
