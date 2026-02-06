import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, KeyboardEvent, LayoutChangeEvent, Platform, View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootStackNavigationProp, RootStackParamList } from "@/app/adapters/primary/react/navigation/types";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

import { useCommentsForCafe } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { useLikesForCafe } from "@/app/adapters/secondary/viewModel/useLikesForCafe";

import { CommentsSection } from "../components/CommentsSection";
import { DetailsActionsRow } from "../components/DetailsActionsRow";
import { DetailsHeroCard } from "../components/DetailsHeroCard";
import { DetailsNavBar } from "../components/DetailsNavBar";
import { DetailsError, DetailsSkeleton } from "../components/DetailsStates";
import { InfoSection } from "../components/InfoSection";
import { PhotosSection } from "../components/PhotosSection";
import { TagsSection } from "../components/TagsSection";
import { styles } from "./styles";

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function CafeDetailsScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const route = useRoute<RouteProp<RootStackParamList, "CafeDetails">>();

	const rawId = route.params?.id;
	const coffeeId = rawId ? parseToCoffeeId(rawId) : null;

	const { coffee } = useCafeFull(coffeeId);
	const isOpenNow = useCafeOpenNow(coffeeId);

	const likes = useLikesForCafe(coffeeId ?? undefined);
	const comments = useCommentsForCafe(coffeeId ?? undefined);

	// --- Keyboard (stable, no KAV)
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	useEffect(() => {
		const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height);
		const onHide = () => setKeyboardHeight(0);

		const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
		const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

		const showSub = Keyboard.addListener(showEvent as any, onShow);
		const hideSub = Keyboard.addListener(hideEvent as any, onHide);

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	// --- Scroll + sticky actions
	const scrollRef = useRef<any>(null);
	const scrollY = useSharedValue(0);
	const actionsThreshold = useSharedValue(180);
	const dragStartY = useSharedValue(0);

	const onScroll = useAnimatedScrollHandler({
		onScroll: (e) => (scrollY.value = e.contentOffset.y),
	});

	const bottomBarStyle = useAnimatedStyle(() => {
		const t = actionsThreshold.value;
		const show = interpolate(scrollY.value, [t - 10, t + 40], [0, 1], Extrapolation.CLAMP);
		return {
			opacity: show,
			transform: [{ translateY: interpolate(show, [0, 1], [18, 0], Extrapolation.CLAMP) }],
		};
	});

	const onActionsLayout = (e: LayoutChangeEvent) => {
		actionsThreshold.value = e.nativeEvent.layout.y + 40;
	};

	// --- Derived
	const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex;
	const todayHoursLabel = coffee?.hours?.[todayIndex]?.label ?? "Horaires non disponibles";

	const status = useMemo(() => {
		if (isOpenNow === undefined) return { label: "STATUT", value: "—" };
		return isOpenNow ? { label: "OUVERT", value: todayHoursLabel } : { label: "FERMÉ", value: todayHoursLabel };
	}, [isOpenNow, todayHoursLabel]);

	const addressLine = useMemo(() => {
		const line1 = coffee?.address?.line1;
		const city = coffee?.address?.city;
		const postal = coffee?.address?.postalCode;

		if (line1 && (postal || city)) return `${line1}, ${[postal, city].filter(Boolean).join(" ")}`;
		if (line1) return line1;
		return [postal, city].filter(Boolean).join(" ") || "";
	}, [coffee?.address?.line1, coffee?.address?.city, coffee?.address?.postalCode]);

	// --- Guards
	if (!coffeeId) return <DetailsError onBack={() => navigation.goBack()} />;
	if (!coffee) return <DetailsSkeleton />;

	// When keyboard opens, ensure bottom reachable
	useEffect(() => {
		if (keyboardHeight > 0) requestAnimationFrame(() => scrollRef.current?.scrollToEnd?.({ animated: true }));
	}, [keyboardHeight]);

	const onBack = () => navigation.goBack();

	const onRefresh = () => {
		likes.refresh();
		// comments: ton hook auto-refresh sur stale. Si tu veux un refresh manuel,
		// on ajoutera `refresh()` dans useCommentsForCafe ensuite.
	};

	const showSticky = keyboardHeight === 0;

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<View style={styles.screen}>
				<DetailsNavBar title={coffee.name} onBack={onBack} onRefresh={onRefresh} />

				<Animated.ScrollView
					ref={scrollRef}
					onScroll={onScroll}
					scrollEventThrottle={16}
					keyboardDismissMode="none"   // on gère nous-mêmes
					keyboardShouldPersistTaps="handled"

					onScrollBeginDrag={(e) => {
						dragStartY.value = scrollY.value;
					}}

					onScrollEndDrag={() => {
						const delta = Math.abs(scrollY.value - dragStartY.value);

						// 👉 ne fermer que si l'utilisateur a vraiment scrollé
						if (keyboardHeight > 0 && delta > 30) {
							Keyboard.dismiss();
						}
					}}

					contentContainerStyle={[
						styles.content,
						{ paddingBottom: 120 + keyboardHeight },
					]}
				>

					<DetailsActionsRow coffee={coffee} addressLine={addressLine} onLayout={onActionsLayout} />

					<PhotosSection photos={coffee.photos ?? []} />

					<InfoSection coffee={coffee} addressLine={addressLine} />

					<TagsSection tags={(coffee as any).tags ?? []} />

					<CommentsSection coffeeId={String(coffeeId)} comments={comments} />
				</Animated.ScrollView>

				{showSticky && (
					<Animated.View style={[styles.bottomBar, bottomBarStyle]}>
						<View style={{ width: "100%" }}>
							<DetailsActionsRow coffee={coffee} addressLine={addressLine} compact />
						</View>
					</Animated.View>
				)}
			</View>
		</SafeAreaView>
	);
}
