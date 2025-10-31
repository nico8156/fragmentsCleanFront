import {SyntheticEvent, useCallback, useMemo, useRef, useState} from "react";
import {
    Animated,
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useArticlesHome } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { MasterHeader } from "@/src/features/home/components/MasterHeader";
import { Categories } from "@/src/features/home/components/Categories";
import { WelcomeMessage } from "@/src/features/home/components/WelcomeMessage";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import { ScanTicketFab } from "@/src/features/scan/components/ScanTicketFab";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const SEARCH_ANIMATION_CONFIG = {
    duration: 180,
    update: {
        type: LayoutAnimation.Types.easeInEaseOut,
    },
} as const;

export function HomeScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const insets = useSafeAreaInsets();
    const { sliderArticles, categories } = useArticlesHome();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [showIcons, setShowIcons] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [query, setQuery] = useState("");

    const coffees = useSelector((state: RootStateWl) => state.cfState.ids.map((id) => state.cfState.byId[id]));

    const filteredResults = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return [];
        return coffees
            .filter((coffee) => coffee?.name?.toLowerCase().includes(normalized))
            .slice(0, 6)
            .map((coffee) => ({
                id: String(coffee?.id ?? ""),
                name: coffee?.name ?? "Café", // fallback
                address: coffee?.address?.line1 ?? undefined,
            }))
            .filter((item) => Boolean(item.id));
    }, [coffees, query]);

    const headerOpacity = scrollY.interpolate({
        inputRange: [50, 150],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const toggleSearch = useCallback(() => {
        LayoutAnimation.configureNext(SEARCH_ANIMATION_CONFIG);
        setIsSearchOpen((value) => {
            const next = !value;
            if (!next) {
                setQuery("");
            }
            return next;
        });
    }, []);

    const openScanModal = useCallback(() => {
        navigation.navigate("ScanTicketModal");
    }, [navigation]);

    const openArticle = useCallback(
        (slug: string) => {
            navigation.navigate("Article", { slug });
        },
        [navigation],
    );

    const openCafeFromSearch = useCallback(
        (id: string) => {
            navigation.navigate("CafeDetails", { id });
            setQuery("");
            LayoutAnimation.configureNext(SEARCH_ANIMATION_CONFIG);
            setIsSearchOpen(false);
        },
        [navigation],
    );

    const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
        listener: ({ nativeEvent }:{nativeEvent: any}) => {
            setShowIcons(nativeEvent.contentOffset.y< 50 );
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={showIcons ? "light-content" : "dark-content"}
                translucent
                backgroundColor="transparent"
            />
            <Animated.View style={[styles.header, { paddingTop: insets.top, opacity: headerOpacity }] }>
                <Pressable onPress={toggleSearch} style={styles.headerIcon} accessibilityRole="button">
                    <Ionicons name="search" size={21} color="#4A4A4A" />
                </Pressable>
                <Text style={styles.logoText}>Fragments</Text>
                <Pressable onPress={openScanModal} style={styles.headerIcon} accessibilityRole="button">
                    <MaterialIcons name="document-scanner" size={21} color="#4A4A4A" />
                </Pressable>
            </Animated.View>

            {showIcons && (
                <View style={[styles.headerBeginner, { paddingTop: insets.top + 12 }] }>
                    <Pressable onPress={toggleSearch} style={styles.iconContainerLeft} accessibilityRole="button">
                        <Ionicons name="search" size={21} color="#4A4A4A" />
                    </Pressable>
                    <Pressable onPress={openScanModal} style={styles.iconContainerRight} accessibilityRole="button">
                        <MaterialIcons name="document-scanner" size={21} color="#4A4A4A" />
                    </Pressable>
                </View>
            )}

            {isSearchOpen ? (
                <View style={[styles.searchPanel, { paddingTop: insets.top + (showIcons ? 80 : 96) }] }>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search" size={18} color="#4A4A4A" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Rechercher un café"
                            placeholderTextColor="#8F8F8F"
                            style={styles.searchInput}
                            returnKeyType="search"
                            autoFocus
                        />
                        {query.length > 0 ? (
                            <Pressable onPress={() => setQuery("")} accessibilityRole="button" hitSlop={10}>
                                <Ionicons name="close-circle" size={18} color="#6B6B6B" />
                            </Pressable>
                        ) : null}
                    </View>
                    {query.length > 0 ? (
                        <View style={styles.searchResults}>
                            {filteredResults.length === 0 ? (
                                <Text style={styles.noResult}>Aucun café ne correspond à ta recherche.</Text>
                            ) : (
                                filteredResults.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        style={styles.searchResultRow}
                                        onPress={() => openCafeFromSearch(item.id)}
                                        accessibilityRole="button"
                                    >
                                        <View>
                                            <Text style={styles.resultTitle}>{item.name}</Text>
                                            {item.address ? <Text style={styles.resultSubtitle}>{item.address}</Text> : null}
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#6B6B6B" />
                                    </Pressable>
                                ))
                            )}
                        </View>
                    ) : null}
                </View>
            ) : null}

            <AnimatedScrollView
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                <MasterHeader articles={sliderArticles} onArticlePress={openArticle} />
                <Categories categories={categories} onSelect={openArticle} />
                <WelcomeMessage />
            </AnimatedScrollView>
            <ScanTicketFab onPress={openScanModal} insetBottom={insets.bottom} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },
    scrollContent: {
        paddingBottom: 160,
    },
    headerBeginner: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: 24,
        zIndex: 500,
    },
    iconContainerLeft: {
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 999,
        padding: 12,
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    iconContainerRight: {
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 999,
        padding: 12,
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        backgroundColor: "rgba(255,255,255,0.97)",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 28,
        paddingBottom: 12,
        zIndex: 600,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E5E5E5",
    },
    headerIcon: {
        padding: 10,
    },
    logoText: {
        fontSize: 22,
        fontWeight: "700",
        color: "#222222",
        letterSpacing: 1.6,
        textTransform: "uppercase",
    },
    searchPanel: {
        position: "absolute",
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        zIndex: 700,
    },
    searchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: Platform.select({ ios: 12, default: 10 }),
        gap: 12,
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#222222",
    },
    searchResults: {
        marginTop: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        shadowColor: "#000000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        gap: 8,
    },
    searchResultRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    resultTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#222222",
    },
    resultSubtitle: {
        fontSize: 13,
        color: "#6E6E73",
        marginTop: 2,
    },
    noResult: {
        fontSize: 14,
        color: "#6E6E73",
    },
});

export default HomeScreen;
