import {useEffect, useRef, useState} from "react";
import {Animated, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from "react-native";
import {Ionicons, MaterialIcons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useArticlesHome} from "@/app/adapters/secondary/viewModel/useArticlesHome";
import {MasterHeader} from "@/app/(tabs)/components/home/MasterHeader";
import {Categories} from "@/app/(tabs)/components/home/Categories";
import {WelcomeMessage} from "@/app/(tabs)/components/home/WelcomeMessage";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ExploreScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sliderArticles, categories } = useArticlesHome();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [showIcons, setShowIcons] = useState(true);

    const headerOpacity = scrollY.interpolate({
        inputRange: [50, 150],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    useEffect(() => {
        const id = scrollY.addListener(({ value }) => {
            setShowIcons(value < 50);
        });
        return () => {
            scrollY.removeListener(id);
        };
    }, [scrollY]);

    const navigateToSearch = () => router.push("/pages/recherche/search");
    const navigateToScan = () => router.push("/camera/Camera");
    const openArticle = (slug: string) => router.push({ pathname: "/articles/[slug]", params: { slug } });

    return (
        <View style={styles.container}>
            <StatusBar barStyle={showIcons ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
            {showIcons && (
                <View style={[styles.headerBeginner, { paddingTop: insets.top + 12 }] }>
                    <Pressable onPress={navigateToSearch} style={styles.iconContainerLeft}>
                        <Ionicons name="search" size={21} color="#4A4A4A" />
                    </Pressable>
                    <Pressable onPress={navigateToScan} style={styles.iconContainerRight}>
                        <MaterialIcons name="document-scanner" size={21} color="#4A4A4A" />
                    </Pressable>
                </View>
            )}
            <Animated.View style={[styles.header, { paddingTop: insets.top, opacity: headerOpacity }] }>
                <Pressable onPress={navigateToSearch} style={styles.headerIcon}>
                    <Ionicons name="search" size={21} color="#4A4A4A" />
                </Pressable>
                <Text style={styles.logoText}>Fragments</Text>
                <Pressable onPress={navigateToScan} style={styles.headerIcon}>
                    <MaterialIcons name="document-scanner" size={21} color="#4A4A4A" />
                </Pressable>
            </Animated.View>
            <AnimatedScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                <MasterHeader articles={sliderArticles} onArticlePress={openArticle} />
                <Categories categories={categories} onSelect={openArticle} />
                <WelcomeMessage />
            </AnimatedScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },
    scrollContent: {
        paddingBottom: 120,
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
});
