import { palette } from "@/app/adapters/primary/react/css/colors";
import { Categories } from "@/app/adapters/primary/react/features/home/components/Categories";
import { MasterHeader } from "@/app/adapters/primary/react/features/home/components/MasterHeader";
import { WelcomeMessage } from "@/app/adapters/primary/react/features/home/components/WelcomeMessage";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { useArticlesHome } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import { dataForPacks } from "@/assets/data/coffeePack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	Animated,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
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
	const { sliderArticles, categories } = useArticlesHome();

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
		<View style={styles.container}>
			<StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

			{/* Scroll: HERO doit remonter tout en haut (derrière header/icônes) */}
			<AnimatedScrollView
				onScroll={handleScroll}
				scrollEventThrottle={16}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.heroSection}>
					<MasterHeader articles={sliderArticles} onArticlePress={openArticle} />
				</View>

				{/* Spacer: évite que les sections démarrent sous la barre */}
				<View style={{ height: 16 }} />

				<View style={styles.sectionSpacing}>
					<Categories categories={categories} onSelect={openArticle} />
				</View>

				<View style={styles.sectionSpacing}>
					<Categories categories={dataForPacks} onSelect={() => { }} />
				</View>

				<WelcomeMessage />
			</AnimatedScrollView>

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
							>
								<Pressable onPress={openSearch} style={styles.headerIcon} accessibilityRole="button">
									<Ionicons name="search" size={21} color={palette.textPrimary} />
								</Pressable>
							</Animated.View>

							<Animated.View
								style={[styles.iconLayer, { opacity: floatingOpacity }]}
								pointerEvents={showFloating ? "auto" : "none"}
							>
								<Pressable onPress={openSearch} style={styles.roundButton} accessibilityRole="button">
									<Ionicons name="search" size={22} color={palette.textPrimary} />
								</Pressable>
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
							>
								<Pressable onPress={openScanModal} style={styles.headerIcon} accessibilityRole="button">
									<MaterialIcons name="document-scanner" size={21} color={palette.textPrimary} />
								</Pressable>
							</Animated.View>

							<Animated.View
								style={[styles.iconLayer, { opacity: floatingOpacity }]}
								pointerEvents={showFloating ? "auto" : "none"}
							>
								<Pressable onPress={openScanModal} style={styles.roundButton} accessibilityRole="button">
									<MaterialIcons name="document-scanner" size={22} color={palette.textPrimary} />
								</Pressable>
							</Animated.View>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
}

const SLOT_SIZE = 56;

const styles = StyleSheet.create({
	container: { flex: 1 },

	scrollContent: {
		paddingBottom: 28,
	},

	heroSection: {
		backgroundColor: palette.surface,
		// pas de marginTop -> l’image peut remonter derrière le header
		marginBottom: 28,
	},

	sectionSpacing: {
		paddingHorizontal: 24,
		marginBottom: 32,
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
		borderBottomColor: palette.secondary_90,
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

	roundButton: {
		backgroundColor: "rgba(33, 24, 19, 0.85)",
		borderRadius: 26,
		padding: 14,
		borderWidth: 1,
		borderColor: palette.secondary_90,
		shadowColor: "#000",
		shadowOpacity: 0.22,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
});

export default HomeScreen;
