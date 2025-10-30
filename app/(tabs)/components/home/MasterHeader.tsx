import {useCallback, useRef, useState} from "react";
import {Dimensions, FlatList, Pressable, StyleSheet, Text, View, ViewToken} from "react-native";
import {Image} from "expo-image";
import {ArticlePreviewVM} from "@/app/adapters/secondary/viewModel/useArticlesHome";

const { width } = Dimensions.get("window");

const CARD_WIDTH = width;
const CARD_HEIGHT = Math.round(width * 0.72);

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
                        <Image
                            source={{ uri: item.cover.url }}
                            style={styles.backgroundImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                        <View style={styles.overlay} />
                        <View style={styles.content}>
                            <View style={styles.tagsContainer}>
                                {item.tags.map((tag) => (
                                    <View key={tag} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.subtitle}>{item.intro}</Text>
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
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        justifyContent: "flex-end",
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 42,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
    },
    tag: {
        backgroundColor: "rgba(255, 255, 255, 0.18)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.45)",
    },
    tagText: {
        color: "#F5F5F5",
        fontWeight: "600",
        fontSize: 12,
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    title: {
        color: "#FFFFFF",
        fontSize: 26,
        fontWeight: "700",
        letterSpacing: 0.2,
        marginBottom: 12,
    },
    subtitle: {
        color: "#EAEAEA",
        fontSize: 14,
        lineHeight: 20,
    },
    pagination: {
        position: "absolute",
        bottom: 16,
        left: 24,
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.4)",
    },
    dotActive: {
        backgroundColor: "#FFFFFF",
        width: 18,
    },
});
