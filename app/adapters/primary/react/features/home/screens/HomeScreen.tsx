import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { HomeContentSections } from "@/app/adapters/primary/react/features/home/components/HomeContentSections";
import { MasterHeader } from "@/app/adapters/primary/react/features/home/components/MasterHeader";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { radii, spacing, scrollContentSpacing } from "@/app/adapters/primary/react/css/designTokens";
import { ContentState, FloatingIconButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { useArticlesHome } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { useCoffeeDiscovery } from "@/app/adapters/secondary/viewModel/useCoffeeDiscovery";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";
import { buildHomeContent, selectHomeCoffeeNames } from "@/app/adapters/secondary/viewModel/homeContentViewModel";
import { useHomeExperiences } from "@/app/adapters/secondary/viewModel/useHomeExperiences";
import { useHomeRefresh } from "@/app/adapters/secondary/viewModel/useHomeRefresh";
import { useHomeReadiness } from "@/app/adapters/secondary/viewModel/useHomeReadiness";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
	Animated,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	RefreshControl,
	ScrollView,
	StatusBar,
	StyleSheet,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const HEADER_BAR_HEIGHT = 56;

// Transition plus douce (plus longue)
const FADE_IN_START = 20;
const FADE_IN_END = 240;

// Hysteresis pour éviter le “flap”
const SHOW_FLOATING_UNDER_Y = 55;
const HIDE_FLOATING_OVER_Y = 95;

export function HomeScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const insets = useSafeAreaInsets();
	const { sliderArticles, articles } = useArticlesHome();
	const { coffees, hasLocation } = useCoffeeDiscovery();
	const pass = usePassRingsViewModel();
	const experiences = useHomeExperiences();
	const { refreshing, refresh, message } = useHomeRefresh();
	const { preparing, catalogueLoading } = useHomeReadiness();
	const coffeeNames = useSelector(selectHomeCoffeeNames);
	const homeContent = useMemo(() => buildHomeContent({ articles, sliderArticles, coffees, hasLocation, pass, experiences, coffeeNames }), [articles, sliderArticles, coffees, hasLocation, pass, experiences, coffeeNames]);

	const scrollY = useRef(new Animated.Value(0)).current;
	const [showFloating, setShowFloating] = useState(true);

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
	const openArticleCatalogue = useCallback(() => navigation.navigate("ArticleCatalogue"), [navigation]);

	const openMap = useCallback(() => navigation.navigate("Tabs", { screen: "Map" }), [navigation]);
	const openCoffee = useCallback((id: string) => navigation.navigate("CafeDetails", { id }), [navigation]);
	const openExperiences = useCallback(() => navigation.navigate("Tabs", { screen: "Profile", params: { screen: "Experiences", initial: false } }), [navigation]);
	const openPass = useCallback(() => navigation.navigate("Tabs", { screen: "Rewards" }), [navigation]);

	// 0 -> header invisible ; 1 -> header fully visible
	const headerProgress = useMemo(() => {
		return scrollY.interpolate({
			inputRange: [FADE_IN_START, FADE_IN_END],
			outputRange: [0, 1],
			extrapolate: "clamp",
		});
	}, [scrollY]);

	const headerBgOpacity = headerProgress;

	const floatingOpacity = useMemo(() => {
		return Animated.subtract(1, headerProgress);
	}, [headerProgress]);

	const handleScroll = useMemo(
		() =>
			Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
				useNativeDriver: true,
				listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
					const y = e.nativeEvent.contentOffset.y;
					setShowFloating((prev) => {
						if (prev && y > HIDE_FLOATING_OVER_Y) return false;
						if (!prev && y < SHOW_FLOATING_UNDER_Y) return true;
						return prev;
					});
				},
			}),
		[scrollY],
	);

	const topPad = insets.top + HEADER_BAR_HEIGHT;

	return (
		<View style={styles.container} testID="home-screen">
			<StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

			{/* Scroll: HERO doit remonter tout en haut (derrière header/icônes) */}
			<ScrollClearance>{bottom => (
				<AnimatedScrollView
					alwaysBounceVertical
					onScroll={handleScroll}
					scrollEventThrottle={16}
					contentContainerStyle={[scrollContentSpacing, { paddingBottom: scrollContentSpacing.paddingBottom + bottom }]}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.textPrimary} progressViewOffset={topPad} />}
				>
					<View style={styles.heroSection}>
						<MasterHeader topClearance={topPad + spacing.standard} articles={sliderArticles} onArticlePress={openArticle} />
					</View>

					{/* Spacer: évite que les sections démarrent sous la barre */}
					<View style={{ height: spacing.standard }} />

					<HomeContentSections content={homeContent} onOpenMap={openMap} onOpenScan={openScanModal} onOpenCoffee={openCoffee} onOpenArticle={openArticle} onOpenArticleCatalogue={openArticleCatalogue} onOpenExperiences={openExperiences} onOpenPass={openPass} />
				</AnimatedScrollView>
			)}</ScrollClearance>

			{/* Header unique au-dessus du HERO */}
			<View style={[styles.headerShell, { paddingTop: insets.top, height: topPad }]}>
				<Animated.View pointerEvents="none" style={[styles.headerBg, { opacity: headerBgOpacity }]} />

				<View style={styles.headerContent}>
					{/* LEFT (Search) - superposition parfaite */}
					<View style={styles.headerSideLeft}>
						<View style={styles.iconSlot}>
							<Animated.View
								style={[styles.iconLayer, { opacity: headerProgress }]}
								pointerEvents={showFloating ? "none" : "auto"}
								accessibilityElementsHidden={showFloating}
							>
								<Pressable onPress={openSearch} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Rechercher">
									<Ionicons name="search" size={21} color={palette.textPrimary} />
								</Pressable>
							</Animated.View>

							<Animated.View
								style={[styles.iconLayer, { opacity: floatingOpacity }]}
								pointerEvents={showFloating ? "auto" : "none"}
								accessibilityElementsHidden={!showFloating}
							>
								<FloatingIconButton compact onPress={openSearch} accessibilityLabel="Rechercher">
									<Ionicons name="search" size={20} color={palette.textPrimary} />
								</FloatingIconButton>
							</Animated.View>
						</View>
					</View>

					{/* Logo - apparaît avec le header */}
					<Animated.Text style={[styles.logoText, { opacity: headerProgress }]}>Fragments</Animated.Text>

					{/* RIGHT (Scan) - superposition parfaite */}
					<View style={styles.headerSideRight}>
						<View style={styles.iconSlot}>
							<Animated.View
								style={[styles.iconLayer, { opacity: headerProgress }]}
								pointerEvents={showFloating ? "none" : "auto"}
								accessibilityElementsHidden={showFloating}
							>
								<Pressable onPress={openScanModal} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Scanner un ticket">
									<MaterialIcons name="document-scanner" size={21} color={palette.textPrimary} />
								</Pressable>
							</Animated.View>

							<Animated.View
								style={[styles.iconLayer, { opacity: floatingOpacity }]}
								pointerEvents={showFloating ? "auto" : "none"}
								accessibilityElementsHidden={!showFloating}
							>
								<FloatingIconButton compact onPress={openScanModal} accessibilityLabel="Scanner un ticket">
									<MaterialIcons name="document-scanner" size={20} color={palette.textPrimary} />
								</FloatingIconButton>
							</Animated.View>
						</View>
					</View>
				</View>
			</View>
			{!preparing && (refreshing || message || catalogueLoading) ? (
				<View pointerEvents="none" style={[styles.refreshNotice, { top: topPad + 8 }]} accessibilityLiveRegion="polite">
					<ContentState kind={refreshing || catalogueLoading ? "loading" : "notice"} message={refreshing ? "Actualisation…" : message ?? "Actualisation des cafés…"} />
				</View>
			) : null}
			{preparing ? <View style={styles.preparing} accessibilityLiveRegion="polite"><ContentState kind="loading" message="Préparation de ton accueil…" /></View> : null}
		</View>
	);
}

const SLOT_SIZE = 56;

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: palette.background },
	preparing: { ...StyleSheet.absoluteFillObject, zIndex: 700, backgroundColor: palette.background, justifyContent: "center", alignItems: "center", gap: 12 },
	refreshNotice: { position: "absolute", zIndex: 650, alignSelf: "center", maxWidth: "90%", paddingHorizontal: spacing.standard, borderRadius: radii.card, backgroundColor: palette.surface },

	heroSection: {
		backgroundColor: palette.surface,
		// pas de marginTop -> l’image peut remonter derrière le header
		marginBottom: spacing.micro,
	},

	// Header unique
	headerShell: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 600,
	},
	headerBg: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(12, 8, 6, 0.92)",
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: palette.border,
	},
	headerContent: {
		height: HEADER_BAR_HEIGHT,
		paddingHorizontal: 24,
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		paddingBottom: 10,
	},

	// Réserve de place pour éviter que le logo bouge
	headerSideLeft: {
		width: 84,
		justifyContent: "flex-end",
		alignItems: "flex-start",
	},
	headerSideRight: {
		width: 84,
		justifyContent: "flex-end",
		alignItems: "flex-end",
	},

	// Slot fixe + couches centrées = superposition parfaite
	iconSlot: {
		width: SLOT_SIZE,
		height: SLOT_SIZE,
		justifyContent: "center",
		alignItems: "center",
	},
	iconLayer: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		justifyContent: "center",
		alignItems: "center",
	},

	headerIcon: {
		width: SLOT_SIZE,
		height: SLOT_SIZE,
		justifyContent: "center",
		alignItems: "center",
	},

	logoText: {
		fontSize: 26,
		fontWeight: "700",
		color: palette.textPrimary,
		letterSpacing: 1.2,
		textTransform: "uppercase",
		marginBottom: 12,
	},

});

export default HomeScreen;
