import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import { scrollContentSpacing } from "@/app/adapters/primary/react/css/designTokens";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	Keyboard,
	KeyboardEvent,
	Platform,
	RefreshControl,
	Dimensions,
	View,
	ScrollView,
	StatusBar,
} from "react-native";
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
import { useSavedCoffeeForCafe } from "@/app/adapters/secondary/viewModel/useSavedCoffeeForCafe";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { CafeDetailsHeader } from "../components/CafeDetailsHeader";
import { CommentsSection } from "../components/CommentsSection";
import { DetailsActionsRow } from "../components/DetailsActionsRow";
import { DetailsError, DetailsSkeleton } from "../components/DetailsStates";
import { InfoSection } from "../components/InfoSection";
import { PhotosSection } from "../components/PhotosSection";
import { TagsSection } from "../components/TagsSection";
import { styles } from "./styles";
import { ExperiencesSection } from "../components/ExperiencesSection";

export default function CafeDetailsScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const route = useRoute<RouteProp<RootStackParamList, "CafeDetails">>();

	const rawId = route.params?.id;
	const coffeeId = rawId ? parseToCoffeeId(rawId) : null;

	const { coffee } = useCafeFull(coffeeId);
	const isOpenNow = useCafeOpenNow(coffeeId);

	const likes = useLikesForCafe(coffeeId ?? undefined);
	const savedCoffee = useSavedCoffeeForCafe(coffeeId ? String(coffeeId) : undefined);
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

	// Scroll position is used only to keep the editor above the keyboard.
	const scrollRef = useRef<any>(null);
	const currentScrollYRef = useRef(0);

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
	if (!coffee) return <DetailsSkeleton onBack={() => navigation.goBack()} />;

	const onBack = () => navigation.goBack();

	const onRefresh = () => {
		likes.refresh();
		// Les expériences sont rafraîchies à leur montage et via Projection Sync.
		// Optionnel si tu ajoutes un refresh manuel côté comments:
		// comments.refresh?.();
	};

	const refreshing = likes.isLoading || likes.isRefreshing;

	const scrollToCommentsEnd = () => {
		// double RAF : laisse le layout se stabiliser (clavier / sections)
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollToEnd?.({ animated: true });
			});
		});
	};

	const ensureRectVisibleAboveKeyboard = ({ windowY, height }: { windowY: number; height: number }) => {
		const keyboardTop = Dimensions.get("window").height - keyboardHeight;
		const visibleBottom = keyboardHeight > 0 ? keyboardTop - 24 : Dimensions.get("window").height - 24;
		const rectBottom = windowY + height;
		const overflow = rectBottom - visibleBottom;

		if (overflow <= 0) return;

		const nextY = Math.max(0, currentScrollYRef.current + overflow + 24);
		scrollRef.current?.scrollTo?.({ y: nextY, animated: true });
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]} testID="coffee-detail-loaded">
			<StatusBar barStyle="light-content" />
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
						likes.toggleLike();
					}}
					onPressComments={scrollToCommentsEnd}
				/>

				<ScrollClearance floatingTab={false}>
					<ScrollView
						ref={scrollRef}
						onScroll={event => { currentScrollYRef.current = event.nativeEvent.contentOffset.y; }}
						scrollEventThrottle={16}
						automaticallyAdjustKeyboardInsets
						keyboardDismissMode="interactive"
						keyboardShouldPersistTaps="handled"
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textMuted} />
						}
						contentContainerStyle={[scrollContentSpacing, { paddingBottom: scrollContentSpacing.paddingBottom + (Platform.OS === "ios" ? 0 : keyboardHeight) }]}
					>
						<PhotosSection photos={coffee.photos ?? []} />
						<DetailsActionsRow
							coffee={coffee}
							addressLine={addressLine}
							saved={{
								saved: savedCoffee.saved,
								pending: savedCoffee.isOptimistic,
								onToggle: savedCoffee.toggle,
							}}
						/>

						<ExperiencesSection coffeeId={String(coffeeId)} />
						<TagsSection tags={(coffee as any).tags ?? []} />
						<InfoSection coffee={coffee} addressLine={addressLine} />

						<CommentsSection
							coffeeId={String(coffeeId)}
							comments={comments}
							onRequestScrollToComposer={scrollToCommentsEnd}
							onRequestEnsureVisible={ensureRectVisibleAboveKeyboard}
						/>
					</ScrollView>
				</ScrollClearance>
			</View>
		</SafeAreaView>
	);
}
