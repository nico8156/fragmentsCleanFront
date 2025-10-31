import { useCallback, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useArticlesHome } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { MasterHeader } from "@/src/features/home/components/MasterHeader";
import { Categories } from "@/src/features/home/components/Categories";
import { WelcomeMessage } from "@/src/features/home/components/WelcomeMessage";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { ScanTicketFab } from "@/src/features/scan/components/ScanTicketFab";
import { palette } from "@/constants/colors";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function HomeScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const insets = useSafeAreaInsets();
    const { sliderArticles, categories } = useArticlesHome();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [showFloatingActions, setShowFloatingActions] = useState(true);

    const headerOpacity = scrollY.interpolate({
        inputRange: [50, 150],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const openScanModal = useCallback(() => {
        navigation.navigate("ScanTicketModal");
    }, [navigation]);

    const openSearch = useCallback(() => {
        navigation.navigate("Search");
    }, [navigation]);

    const openArticle = useCallback(
        (slug: string) => {
            navigation.navigate("Article", { slug });
        },
        [navigation],
    );

    const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
        listener: ({ nativeEvent }: { nativeEvent: any }) => {
            setShowFloatingActions(nativeEvent.contentOffset.y < 60);
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                translucent
                backgroundColor="transparent"
            />
            <Animated.View style={[styles.header, { paddingTop: insets.top + 6, opacity: headerOpacity }] }>
                <Pressable onPress={openSearch} style={styles.headerIcon} accessibilityRole="button">
                    <Ionicons name="search" size={21} color={palette.textPrimary} />
                </Pressable>
                <Text style={styles.logoText}>Fragments</Text>
                <Pressable onPress={openScanModal} style={styles.headerIcon} accessibilityRole="button">
                    <MaterialIcons name="document-scanner" size={21} color={palette.textPrimary} />
                </Pressable>
            </Animated.View>
            <AnimatedScrollView
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70 }]}
            >
                <View style={styles.heroSection}>
                    <MasterHeader articles={sliderArticles} onArticlePress={openArticle} />
                </View>
                <View style={styles.sectionSpacing}>
                    <Categories categories={categories} onSelect={openArticle} />
                </View>
                <WelcomeMessage />
            </AnimatedScrollView>
            {showFloatingActions ? (
                <View style={[styles.floatingActions, { paddingTop: insets.top + 16 }] }>
                    <Pressable onPress={openSearch} style={styles.roundButton} accessibilityRole="button">
                        <Ionicons name="search" size={22} color={palette.textPrimary} />
                    </Pressable>
                    <Pressable onPress={openScanModal} style={styles.roundButton} accessibilityRole="button">
                        <MaterialIcons name="document-scanner" size={22} color={palette.textPrimary} />
                    </Pressable>
                </View>
            ) : null}
            <ScanTicketFab onPress={openScanModal} insetBottom={insets.bottom} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollContent: {
        paddingBottom: 160,
    },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        backgroundColor: "rgba(12, 8, 6, 0.92)",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingBottom: 10,
        zIndex: 600,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(255,255,255,0.06)",
    },
    headerIcon: {
        padding: 10,
    },
    logoText: {
        fontSize: 22,
        fontWeight: "700",
        color: palette.textPrimary,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    heroSection: {
        marginBottom: 40,
    },
    sectionSpacing: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    floatingActions: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        zIndex: 500,
    },
    roundButton: {
        backgroundColor: "rgba(33, 24, 19, 0.85)",
        borderRadius: 26,
        padding: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
});

export default HomeScreen;
