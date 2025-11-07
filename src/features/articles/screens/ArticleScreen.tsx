import { useEffect, useMemo } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useArticle } from "@/app/adapters/secondary/viewModel/useArticle";
import { articleRetrievalBySlug } from "@/app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval";
import { articleLoadingStates } from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import { RootStackParamList, RootStackNavigationProp } from "@/src/navigation/types";
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";

const formatDate = (value?: string) => {
    if (!value) return undefined;
    try {
        return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return undefined;
    }
};

export function ArticleScreen() {
    const { params } = useRoute<RouteProp<RootStackParamList, 'Article'>>();
    const navigation = useNavigation<RootStackNavigationProp>();
    const normalizedSlug = useMemo(() => params.slug, [params.slug]);
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch<any>();
    const { article, status } = useArticle(normalizedSlug);

    useEffect(() => {
        if (!normalizedSlug) return;
        if (!article && status !== articleLoadingStates.PENDING) {
            dispatch(articleRetrievalBySlug({ slug: normalizedSlug, locale: "fr-FR" }));
        }
    }, [dispatch, normalizedSlug, article, status]);

    const publishedOn = formatDate(article?.publishedAt ?? article?.updatedAt);

    const goBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <AnimatedBackButton onPress={goBack} topInset={insets.top} />
            {!article && status === articleLoadingStates.PENDING ? (
                <View style={styles.loaderWrapper}>
                    <ActivityIndicator size="large" color="#2F2F2F" />
                </View>
            ) : !article ? (
                <View style={styles.loaderWrapper}>
                    <Text style={styles.errorText}>Impossible de charger cet article. Réessaie plus tard.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Image
                        source={{ uri: article.cover?.url ?? article.blocks[0]?.photo?.url ?? "" }}
                        style={styles.coverImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                    <View style={styles.articleContent}>
                        <Text style={styles.metaText}>
                            Par {article.author.name} • {article.readingTimeMin} min de lecture
                        </Text>
                        {publishedOn && <Text style={styles.dateText}>Mis à jour le {publishedOn}</Text>}
                        <View style={styles.tagsContainer}>
                            {article.tags.map((tag) => (
                                <View key={tag} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.title}>{article.title}</Text>
                        <Text style={styles.intro}>{article.intro}</Text>
                        {article.blocks.map((block, index) => (
                            <View key={`${block.heading}-${index}`} style={styles.block}>
                                <Text style={styles.blockHeading}>{block.heading}</Text>
                                {block.photo ? (
                                    <Image
                                        source={{ uri: block.photo.url }}
                                        style={styles.blockImage}
                                        contentFit="cover"
                                        cachePolicy="memory-disk"
                                    />
                                ) : null}
                                <Text style={styles.blockParagraph}>{block.paragraph}</Text>
                            </View>
                        ))}
                        <Text style={styles.conclusion}>{article.conclusion}</Text>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

type AnimatedBackButtonProps = {
    onPress: () => void;
    topInset: number;
};

function AnimatedBackButton({ onPress, topInset }: AnimatedBackButtonProps) {
    return (
        <Pressable onPress={onPress} style={[styles.backButton, { top: topInset + 12 }]}>
            <SymbolView name="chevron.left" size={18} tintColor="#1C1C1E    " />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        paddingBottom: 48,
    },
    loaderWrapper: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    errorText: {
        textAlign: "center",
        fontSize: 16,
        color: "#5B5B5B",
    },
    coverImage: {
        width: "100%",
        height: 450,
        marginBottom:10
    },
    articleContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    metaText: {
        fontSize: 13,
        color: "#6A6A6A",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    dateText: {
        fontSize: 12,
        color: "#9A9A9A",
        marginTop: 8,
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
        marginBottom: 16,
    },
    tag: {
        backgroundColor: "#F3F4F6",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
        marginTop: 8,
    },
    tagText: {
        color: "#4B5563",
        fontSize: 12,
        fontWeight: "600",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
        marginTop: 16,
    },
    intro: {
        fontSize: 16,
        color: "#4B5563",
        marginTop: 12,
        lineHeight: 24,
    },
    block: {
        marginTop: 24,
        gap: 12,
    },
    blockHeading: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
    },
    blockParagraph: {
        fontSize: 16,
        color: "#374151",
        lineHeight: 24,
    },
    blockImage: {
        width: "100%",
        height: 220,
        borderRadius: 16,
    },
    conclusion: {
        marginTop: 32,
        fontSize: 16,
        color: "#111827",
        lineHeight: 24,
        fontWeight: "600",
    },
    backButton: {
        width: 48,
        height: 48,
        position: "absolute",
        left: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        zIndex: 10,
        backgroundColor: "rgba(255,255,255,0.85)",
        borderWidth: 1,
        borderColor: palette.primary_90,
        borderRadius: 999,
        shadowColor: "#000000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    backText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
});

export default ArticleScreen;
