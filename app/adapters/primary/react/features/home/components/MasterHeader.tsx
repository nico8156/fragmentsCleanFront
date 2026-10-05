import { useCallback, useState } from "react";
import { useWindowDimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { ArticlePreviewVM } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import { articleTagColors } from "../articleTagColors";

type Props = {
    articles: ArticlePreviewVM[];
    topClearance?: number;
    onArticlePress?: (slug: string) => void;
};

export function MasterHeader({ articles, onArticlePress, topClearance = 112 }: Props) {
    const { width, height: windowHeight, fontScale } = useWindowDimensions();
    // Keep two title/intro lines clear of the controls, even with large text.
    const copyHeight = (2 * typography.screen.lineHeight + 3 * typography.body.lineHeight) * fontScale
        + 2 * spacing.compact + spacing.micro + 44;
    const height = Math.max(Math.round(Math.min(width * 1.16, windowHeight * 0.6)), topClearance + copyHeight);
    if (!articles.length) return null;
    // An editorial reorder/removal or viewport resize starts a coherent new pager.
    return <ArticleCarousel key={JSON.stringify([width, articles.map(item => item.id)])}
        articles={articles} onArticlePress={onArticlePress} width={width} height={height} />;
}

function ArticleCarousel({ articles, onArticlePress, width, height }: Props & { width: number; height: number }) {
    const [index, setIndex] = useState(0);
    const size = { width, height };

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
        <View style={size}>
            <FlatList
                testID="home-hero-carousel"
                data={articles}
                style={size}
                horizontal
                pagingEnabled
                directionalLockEnabled
                scrollEnabled={articles.length > 1}
                getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable style={[styles.card, size]} onPress={() => handlePress(item.slug)} accessibilityRole="button" accessibilityLabel={item.title}>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={item.cover.url}
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
                                <View style={[styles.tag, { backgroundColor: articleTagColors(item.tags[0]).backgroundColor }]}>
                                    <Text style={[styles.tagText, { color: articleTagColors(item.tags[0]).color }]}>{item.tags[0]}</Text>
                                </View>
                            ) : null}
                            <Text style={styles.subtitle} numberOfLines={2}>
                                {item.intro}
                            </Text>
                        </View>
                    </Pressable>
                )}
                onMomentumScrollEnd={event => setIndex(Math.max(0, Math.min(articles.length - 1,
                    Math.round(event.nativeEvent.contentOffset.x / width))))}
            />
            {articles.length > 1 ? <View testID="hero-pagination" style={styles.pagination} pointerEvents="none"
                accessible accessibilityLabel={`Article ${index + 1} sur ${articles.length}`}>
                {articles.map((item, itemIndex) => (
                    <View
                        key={item.id}
                        style={[styles.dot, index === itemIndex ? styles.dotActive : undefined]}
                    />
                ))}
            </View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: palette.surface,
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
        gap: spacing.compact,
        paddingBottom: 44,
    },
    tag: {
        alignSelf: "flex-start",
        backgroundColor: palette.success,
        paddingVertical: 4,
        paddingHorizontal: spacing.compact,

    },
    tagText: {
        color: "#1A0D08",
        ...typography.body,
        fontWeight: "600",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    title: {
        color: palette.textPrimary,
        ...typography.screen,
    },
    subtitle: {
        color: palette.textPrimary,
        ...typography.body,
    },
    pagination: {
        position: "absolute",
        bottom: 0,
        flexDirection: "row",
        left: 0,
        right: 0,
        justifyContent: "center",
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
