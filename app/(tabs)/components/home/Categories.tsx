import {memo} from "react";
import {FlatList, Pressable, StyleSheet, Text, View} from "react-native";
import {Image} from "expo-image";
import {HomeCategoryItemVM, HomeCategoryVM} from "@/app/adapters/secondary/viewModel/useArticlesHome";

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
    },
    categoryBlock: {
    },
    categorySpacing: {
        marginTop: 24,
    },
    categoryHeader: {
        marginBottom: 12,
    },
    categoryTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1F1F1F",
    },
    categorySubtitle: {
        color: "#6B6B6B",
        fontSize: 14,
        lineHeight: 20,
    },
    listContent: {
        paddingRight: 24,
    },
    separator: {
        width: 16,
    },
    itemContainer: {
        width: 120,
        marginRight: 4,
    },
    logoWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        overflow: "hidden",
        backgroundColor: "#F1F1F1",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
    },
    logo: {
        width: "100%",
        height: "100%",
    },
    itemTitle: {
        fontSize: 13,
        lineHeight: 18,
        color: "#2D2D2D",
        fontWeight: "600",
    },
});
