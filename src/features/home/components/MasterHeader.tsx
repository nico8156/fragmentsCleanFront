import { useCallback, useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, ViewToken } from "react-native";
import { Image } from "expo-image";
import { ArticlePreviewVM } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { palette } from "@/constants/colors";

const { width } = Dimensions.get("window");

const CARD_WIDTH = width;
const CARD_HEIGHT = Math.round(width * 1.3);


type Props = {
    articles: ArticlePreviewVM[];
    onArticlePress?: (slug: string) => void;
};

export function MasterHeader({ articles, onArticlePress }: Props) {
    const [index, setIndex] = useState(0);
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index ?? 0;
            setIndex((previous) => (previous === newIndex ? previous : newIndex));
        }
    });

    const handlePress = useCallback(
        (slug: string) => {
            onArticlePress?.(slug);
        },
        [onArticlePress],
    );

    if (articles.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={articles}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable style={styles.card} onPress={() => handlePress(item.slug)}>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: item.cover.url }}
                                style={styles.backgroundImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                            <View style={styles.overlay} />
                        </View>
                        <View style={styles.content}>
                            <Text style={styles.title} numberOfLines={2}>
                                {item.title}
                            </Text>
                            {item.tags.length > 0 ? (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{item.tags[0]}</Text>
                                </View>
                            ) : null}
                            <Text style={styles.subtitle} numberOfLines={2}>
                                {item.intro}
                            </Text>
                        </View>
                    </Pressable>
                )}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
            />
            <View style={styles.pagination}>
                {articles.map((item, itemIndex) => (
                    <View
                        key={item.id}
                        style={[styles.dot, index === itemIndex ? styles.dotActive : undefined]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    card: {
        backgroundColor: "red",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        paddingHorizontal: 24,
        justifyContent: "flex-end",
    },
    imageWrapper: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
        backgroundColor: palette.surface,
    },
    backgroundImage: {
        width: "100%",
        height: "100%",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(8, 5, 4, 0.15)",
    },
    content: {
        gap: 16,
        paddingBottom: 54,
        paddingHorizontal: 5,
    },
    tag: {
        alignSelf: "flex-start",
        backgroundColor: palette.success,
        paddingVertical: 6,
        paddingHorizontal: 14,

        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
    },
    tagText: {
        color: "#1A0D08",
        fontWeight: "700",
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    title: {
        color: palette.textPrimary,
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: 0.2,
        lineHeight: 34,
    },
    subtitle: {
        color: palette.textPrimary,
        fontSize: 15,
        lineHeight: 22,
    },
    pagination: {
        position: "absolute",
        bottom: 0,
        flexDirection: "row",
        left: width / 2 - 37,
        gap: 6,
        marginBottom: 18,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.35)",
    },
    dotActive: {
        backgroundColor: "#FFFFFF",
        width: 12,
    },
});
