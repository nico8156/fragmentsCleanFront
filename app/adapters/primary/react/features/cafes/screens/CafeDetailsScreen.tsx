import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	Keyboard,
	KeyboardEvent,
	LayoutChangeEvent,
	Platform,
	RefreshControl,
	View,
} from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
	RootStackNavigationProp,
	RootStackParamList,
} from "@/app/adapters/primary/react/navigation/types";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

import { useCommentsForCafe } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { useLikesForCafe } from "@/app/adapters/secondary/viewModel/useLikesForCafe";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { CafeDetailsHeader } from "../components/CafeDetailsHeader";
import { CommentsSection } from "../components/CommentsSection";
import { DetailsActionsRow } from "../components/DetailsActionsRow";
import { DetailsError, DetailsSkeleton } from "../components/DetailsStates";
import { InfoSection } from "../components/InfoSection";
import { PhotosSection } from "../components/PhotosSection";
import { TagsSection } from "../components/TagsSection";
import { styles } from "./styles";

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

	const statusLabel = useMemo(() => {
		if (isOpenNow === undefined) return "STATUT";
		return isOpenNow ? "OUVERT" : "FERMÉ";
	}, [isOpenNow]);

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

	const onBack = () => navigation.goBack();

	const onRefresh = () => {
		likes.refresh();
		// Optionnel si tu ajoutes un refresh manuel côté comments:
		// comments.refresh?.();
	};

	const refreshing = likes.isLoading || likes.isRefreshing;
	const showSticky = keyboardHeight === 0;

	const scrollToCommentsEnd = () => {
		// double RAF : laisse le layout se stabiliser (clavier / sections)
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollToEnd?.({ animated: true });
			});
		});
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<View style={styles.screen}>
				<CafeDetailsHeader
					title={coffee.name}
					statusLabel={statusLabel}
					likeCount={likes.count}
					likedByMe={likes.likedByMe}
					likeSync={likes.sync}
					commentCount={comments.comments.length}
					commentSync={comments.sync}
					onBack={onBack}
					onPressLike={() => {
						if (likes.isLoading || likes.isRefreshing) return;
						likes.toggleLike();
					}}
					onPressComments={scrollToCommentsEnd}
				/>

				<Animated.ScrollView
					ref={scrollRef}
					onScroll={onScroll}
					scrollEventThrottle={16}
					keyboardDismissMode="none"
					keyboardShouldPersistTaps="handled"
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textMuted} />
					}
					onScrollBeginDrag={() => {
						dragStartY.value = scrollY.value;
					}}
					onScrollEndDrag={() => {
						const delta = Math.abs(scrollY.value - dragStartY.value);
						if (keyboardHeight > 0 && delta > 30) {
							Keyboard.dismiss();
						}
					}}
					contentContainerStyle={[styles.content, { paddingBottom: 120 + keyboardHeight }]}
				>
					<DetailsActionsRow coffee={coffee} addressLine={addressLine} onLayout={onActionsLayout} />

					<PhotosSection photos={coffee.photos ?? []} />
					<InfoSection coffee={coffee} addressLine={addressLine} />
					<TagsSection tags={(coffee as any).tags ?? []} />

					<CommentsSection
						coffeeId={String(coffeeId)}
						comments={comments}
						onRequestScrollToComposer={scrollToCommentsEnd}
						onRequestScrollToY={(y) => {
							requestAnimationFrame(() => scrollRef.current?.scrollTo?.({ y, animated: true }));
						}}
					/>
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

