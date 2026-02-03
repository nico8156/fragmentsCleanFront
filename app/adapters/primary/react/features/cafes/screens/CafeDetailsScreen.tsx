import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp, RootStackParamList } from "@/app/adapters/primary/react/navigation/types";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	FlatList,
	Image,
	Keyboard,
	KeyboardEvent,
	LayoutChangeEvent,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
	Extrapolation,
	interpolate,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function CafeDetailsScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const route = useRoute<RouteProp<RootStackParamList, "CafeDetails">>();

	// --- Route param
	const rawId = route.params?.id;
	const coffeeId = rawId ? parseToCoffeeId(rawId) : null;

	// --- Data (Redux VM)
	const { coffee } = useCafeFull(coffeeId);
	const isOpenNow = useCafeOpenNow(coffeeId);

	// --- Keyboard handling (stable, no KAV)
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	useEffect(() => {
		const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height);
		const onHide = () => setKeyboardHeight(0);

		// iOS: willShow/willHide gives smoother updates; Android: didShow/didHide
		const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
		const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

		const showSub = Keyboard.addListener(showEvent as any, onShow);
		const hideSub = Keyboard.addListener(hideEvent as any, onHide);

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	// --- Guards
	if (!coffeeId) {
		return (
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<View style={[styles.screen, styles.center]}>
					<Text style={styles.errorTitle}>Café introuvable</Text>
					<Text style={styles.errorText}>Impossible de lire l’identifiant de ce café.</Text>
					<Pressable onPress={() => navigation.goBack()} style={styles.errorBtn}>
						<Text style={styles.errorBtnText}>Retour</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	if (!coffee) {
		return (
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<View style={[styles.screen, styles.center]}>
					<Text style={styles.loadingText}>Chargement…</Text>
				</View>
			</SafeAreaView>
		);
	}

	// --- Derivations from CafeFullVM
	const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex;
	const todayHoursLabel = coffee?.hours?.[todayIndex]?.label ?? "Horaires non disponibles";

	const addressLine = useMemo(() => {
		const line1 = coffee.address?.line1;
		const city = coffee.address?.city;
		const postal = coffee.address?.postalCode;

		if (line1 && (postal || city)) return `${line1}, ${[postal, city].filter(Boolean).join(" ")}`;
		if (line1) return line1;
		return [postal, city].filter(Boolean).join(" ") || "";
	}, [coffee.address?.line1, coffee.address?.city, coffee.address?.postalCode]);

	const photos = coffee.photos ?? [];

	// Placeholders until your VM provides them
	const tags: string[] = (coffee as any).tags ?? [];
	const priceLabel: string | undefined = (coffee as any).priceLabel;
	const brandLabel: string | undefined = (coffee as any).brandLabel;
	const logoUri: string | undefined = (coffee as any).logoUri;

	// Like/comment counts placeholders
	const likeCount: number = (coffee as any).likeCount ?? 0;
	const commentCount: number = (coffee as any).commentCount ?? 0;

	// --- UI state
	const scrollY = useSharedValue(0);
	const actionsThreshold = useSharedValue(160);
	const inputRef = useRef<TextInput>(null);
	const scrollRef = useRef<any>(null);

	const [commentDraft, setCommentDraft] = useState("");

	const status = useMemo(() => {
		if (isOpenNow === undefined) return { label: "STATUT", value: "?" };
		return isOpenNow ? { label: "OUVERT", value: todayHoursLabel } : { label: "FERMÉ", value: todayHoursLabel };
	}, [isOpenNow, todayHoursLabel]);

	const onScroll = useAnimatedScrollHandler({
		onScroll: (e) => {
			scrollY.value = e.contentOffset.y;
		},
	});

	const bottomBarStyle = useAnimatedStyle(() => {
		const t = actionsThreshold.value;
		const show = interpolate(scrollY.value, [t - 10, t + 30], [0, 1], Extrapolation.CLAMP);
		return {
			opacity: show,
			transform: [{ translateY: interpolate(show, [0, 1], [22, 0], Extrapolation.CLAMP) }],
		};
	});

	const onActionsLayout = (e: LayoutChangeEvent) => {
		const { y } = e.nativeEvent.layout;
		actionsThreshold.value = y + 40;
	};

	// --- Handlers (wire later)
	const onPressBack = () => navigation.goBack();
	const onPressItinerary = () => { };
	const onPressFollow = () => { };
	const onPressCall = () => { };
	const onPressShare = () => { };
	const onPressLike = () => { };
	const onPressComments = () => { };

	const focusComment = () => {
		onPressComments?.();
		requestAnimationFrame(() => inputRef.current?.focus());
	};

	const submit = () => {
		const txt = commentDraft.trim();
		if (!txt) return;
		// TODO: wire later
		// onSubmitComment(txt)
		setCommentDraft("");
		Keyboard.dismiss();
	};

	// When keyboard opens, ensure the input area is reachable
	useEffect(() => {
		if (keyboardHeight > 0) {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollToEnd?.({ animated: true });
			});
		}
	}, [keyboardHeight]);

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<View style={styles.screen}>
				{/* Top nav */}
				<View style={styles.nav}>
					<Pressable onPress={onPressBack} style={styles.navBtn}>
						<SymbolView
							name="chevron.left"
							size={18}
							tintColor={palette.textPrimary_1}
							fallback={<Text>{"<"}</Text>}
						/>
					</Pressable>

					<Text style={styles.navTitle} numberOfLines={1}>
						{coffee.name}
					</Text>

					<Pressable style={styles.navBtn}>
						<SymbolView name="ellipsis" size={18} tintColor={palette.textPrimary_1} fallback={<Text>•••</Text>} />
					</Pressable>
				</View>

				<Animated.ScrollView
					ref={scrollRef}
					onScroll={onScroll}
					scrollEventThrottle={16}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={[
						styles.content,
						// Big fix: make room for bottom bar + keyboard (no freeze)
						{ paddingBottom: 120 + keyboardHeight },
					]}
				>
					{/* Header Brand */}
					<View style={styles.header}>
						<View style={styles.headerLeft}>
							<View style={styles.logoWrap}>
								{logoUri ? (
									<Image source={{ uri: logoUri }} style={styles.logo} />
								) : (
									<View style={styles.logoPlaceholder}>
										<Text style={styles.logoPlaceholderText}>☕️</Text>
									</View>
								)}
							</View>

							<View style={{ flex: 1, gap: 4 }}>
								{!!brandLabel ? <Text style={styles.brandLabel}>{brandLabel.toUpperCase()}</Text> : null}
								<Text style={styles.title} numberOfLines={2}>
									{coffee.name}
								</Text>
							</View>
						</View>

						<View style={styles.headerRight}>
							<Pressable onPress={onPressLike} style={styles.metric}>
								<SymbolView name="heart.fill" size={18} tintColor="#E74C3C" fallback={<Text>♥</Text>} />
								<Text style={styles.metricText}>{likeCount}</Text>
							</Pressable>

							<Pressable onPress={onPressComments} style={styles.metric}>
								<SymbolView
									name="bubble.left.fill"
									size={18}
									tintColor={palette.textMuted}
									fallback={<Text>💬</Text>}
								/>
								<Text style={styles.metricText}>{commentCount}</Text>
							</Pressable>
						</View>
					</View>

					{/* Top actions bar */}
					<View onLayout={onActionsLayout} style={styles.actionsRow}>
						<ActionButton variant="primary" icon="figure.walk" label="Itinéraire" onPress={onPressItinerary} />
						<ActionButton variant="outline" icon="plus" label="Suivre" onPress={onPressFollow} />
						<ActionButton variant="outline" icon="phone" label="Appeler" onPress={onPressCall} />
						<ActionButton variant="outline" icon="square.and.arrow.up" label="Partager" onPress={onPressShare} />
					</View>

					{/* Photos carousel */}
					<View style={styles.carouselWrap}>
						<FlatList
							data={photos}
							keyExtractor={(uri, idx) => `${uri}-${idx}`}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
							renderItem={({ item }) => <Image source={{ uri: item }} style={styles.photo} />}
							ListEmptyComponent={
								<View style={[styles.photo, styles.photoEmpty]}>
									<Text style={styles.photoEmptyText}>Aucune photo</Text>
								</View>
							}
						/>
					</View>

					{/* General info */}
					<Section title="Général">
						<View style={styles.infoRow}>
							<View style={[styles.statusBadge, isOpenNow ? styles.statusOpen : styles.statusClosed]}>
								<Text style={styles.statusBadgeText}>{status.label}</Text>
							</View>

							<Text style={styles.infoMain} numberOfLines={1}>
								{status.value || "Horaires dans la fiche"}
							</Text>
						</View>

						<InfoLine icon="mappin.and.ellipse" text={addressLine || "Adresse indisponible"} />

						{!!priceLabel ? <InfoLine icon="eurosign" text={priceLabel} /> : null}
					</Section>

					{/* Tags */}
					{tags?.length ? (
						<Section title="Tags">
							<View style={styles.tagsWrap}>
								{tags.map((t) => (
									<TagChip key={t} label={t} />
								))}
							</View>
						</Section>
					) : null}

					{/* Comments */}
					<Section title="Commentaires">
						<Pressable onPress={focusComment} style={styles.commentBox}>
							<Text style={styles.commentPlaceholder}>Écrivez votre commentaire…</Text>
						</Pressable>

						<TextInput
							ref={inputRef}
							value={commentDraft}
							onChangeText={setCommentDraft}
							placeholder="Écrivez votre commentaire ici"
							placeholderTextColor={palette.textMuted}
							style={styles.commentInput}
							multiline
							returnKeyType="default"
							blurOnSubmit={false}
						/>

						<Pressable onPress={submit} style={({ pressed }) => [styles.commentCta, pressed && styles.pressed]}>
							<Text style={styles.commentCtaText}>Commenter</Text>
						</Pressable>

						<View style={{ height: 10 }} />
					</Section>
				</Animated.ScrollView>

				{/* Bottom sticky actions: hide when keyboard is visible (prevents overlap/buggy feel) */}
				{keyboardHeight === 0 && (
					<Animated.View style={[styles.bottomBar, bottomBarStyle]}>
						<View style={styles.bottomBarInner}>
							<ActionButton variant="primary" icon="figure.walk" label="Itinéraire" onPress={onPressItinerary} compact />
							<ActionButton variant="outline" icon="plus" label="Suivre" onPress={onPressFollow} compact />
							<ActionButton variant="outline" icon="phone" label="Appeler" onPress={onPressCall} compact />
							<ActionButton
								variant="outline"
								icon="square.and.arrow.up"
								label="Partager"
								onPress={onPressShare}
								compact
							/>
						</View>
					</Animated.View>
				)}
			</View>
		</SafeAreaView>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			<View style={styles.sectionCard}>{children}</View>
		</View>
	);
}

function InfoLine({ icon, text }: { icon: string; text: string }) {
	return (
		<View style={styles.line}>
			<SymbolView name={icon as any} size={18} tintColor={palette.textMuted} fallback={<Text>•</Text>} />
			<Text style={styles.lineText} numberOfLines={2}>
				{text}
			</Text>
		</View>
	);
}

function TagChip({ label }: { label: string }) {
	return (
		<View style={styles.tag}>
			<Text style={styles.tagText}>{label}</Text>
		</View>
	);
}

function ActionButton({
	variant,
	icon,
	label,
	onPress,
	compact,
}: {
	variant: "primary" | "outline";
	icon: string;
	label: string;
	onPress: () => void;
	compact?: boolean;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.actionBtn,
				compact && styles.actionBtnCompact,
				variant === "primary" ? styles.actionPrimary : styles.actionOutline,
				pressed && styles.pressed,
			]}
		>
			<SymbolView
				name={icon as any}
				size={18}
				tintColor={variant === "primary" ? "white" : palette.textPrimary_1}
				fallback={<Text>•</Text>}
			/>
			<Text
				style={[
					styles.actionText,
					compact && styles.actionTextCompact,
					variant === "primary" ? styles.actionTextPrimary : styles.actionTextOutline,
				]}
				numberOfLines={1}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: palette.background_1 },

	screen: { flex: 1, backgroundColor: palette.background_1 },

	center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },

	loadingText: { color: palette.textMuted, fontWeight: "800" },
	errorTitle: { fontSize: 18, fontWeight: "900", color: palette.textPrimary_1 },
	errorText: { marginTop: 6, color: palette.textMuted, fontWeight: "700", textAlign: "center" },
	errorBtn: {
		marginTop: 14,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	errorBtnText: { fontWeight: "900", color: palette.textPrimary_1 },

	nav: {
		height: 54,
		paddingHorizontal: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: palette.background_1,
	},
	navBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	navTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: palette.textPrimary_1 },

	content: { paddingBottom: 20 },

	header: {
		paddingHorizontal: 16,
		paddingTop: 10,
		paddingBottom: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
	logoWrap: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.06)" },
	logo: { width: 44, height: 44 },
	logoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
	logoPlaceholderText: { fontSize: 18 },

	brandLabel: { fontSize: 12, fontWeight: "900", color: "#7DB6FF", letterSpacing: 1 },
	title: { fontSize: 26, fontWeight: "900", color: palette.textPrimary_1, letterSpacing: -0.4 },

	headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
	metric: { flexDirection: "row", alignItems: "center", gap: 6 },
	metricText: { fontSize: 14, fontWeight: "800", color: palette.textPrimary_1 },

	actionsRow: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 12,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},

	actionBtn: {
		height: 44,
		paddingHorizontal: 14,
		borderRadius: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	actionBtnCompact: { height: 42, paddingHorizontal: 12, borderRadius: 16 },

	actionPrimary: { backgroundColor: "#4CAF50" },
	actionOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(0,0,0,0.14)" },

	actionText: { fontSize: 15, fontWeight: "900" },
	actionTextCompact: { fontSize: 14 },
	actionTextPrimary: { color: "white" },
	actionTextOutline: { color: palette.textPrimary_1 },

	carouselWrap: { paddingVertical: 6 },
	photo: {
		width: 280,
		height: 200,
		borderRadius: 18,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	photoEmpty: { alignItems: "center", justifyContent: "center" },
	photoEmptyText: { color: palette.textMuted, fontWeight: "800" },

	section: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
	sectionTitle: { fontSize: 22, fontWeight: "900", color: "#4CAF50" },
	sectionCard: {
		borderRadius: 18,
		backgroundColor: "rgba(0,0,0,0.03)",
		padding: 14,
		gap: 12,
	},

	infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	statusBadge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
	},
	statusOpen: { backgroundColor: "rgba(76, 175, 80, 0.18)" },
	statusClosed: { backgroundColor: "rgba(231, 76, 60, 0.16)" },
	statusBadgeText: { fontSize: 13, fontWeight: "900", color: palette.textPrimary_1, letterSpacing: 0.8 },
	infoMain: { flex: 1, fontSize: 14, fontWeight: "800", color: palette.textPrimary_1, opacity: 0.85 },

	line: { flexDirection: "row", alignItems: "center", gap: 10 },
	lineText: { flex: 1, fontSize: 14, fontWeight: "700", color: palette.textPrimary_1 },

	tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	tag: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
	},
	tagText: { fontSize: 14, fontWeight: "800", color: palette.textPrimary_1 },

	commentBox: {
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.10)",
		backgroundColor: "white",
		padding: 14,
	},
	commentPlaceholder: { color: palette.textMuted, fontWeight: "700" },
	commentInput: {
		minHeight: 90,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.10)",
		backgroundColor: "white",
		padding: 14,
		color: palette.textPrimary_1,
		fontWeight: "700",
	},
	commentCta: {
		height: 52,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0,0,0,0.08)",
	},
	commentCtaText: { fontSize: 16, fontWeight: "900", color: palette.textMuted },

	pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

	bottomBar: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 12,
		paddingBottom: Platform.OS === "ios" ? 18 : 12,
		paddingTop: 10,
		backgroundColor: "rgba(255,255,255,0.92)",
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,0.08)",
	},
	bottomBarInner: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		justifyContent: "center",
	},
});

// import { useMemo, useState } from "react";
// import {
//     FlatList,
//     Linking,
//     Pressable,
//     ScrollView,
//     StatusBar,
//     StyleSheet,
//     Text,
//     View,
// } from "react-native";
// import { Image } from "expo-image";
// import { SymbolView } from "expo-symbols";
// import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
// import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
// import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
// import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
// import { RootStackParamList, RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
// import {palette} from "@/app/adapters/primary/react/css/colors";
// import { SafeAreaView } from "react-native-safe-area-context";
//
// const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
// type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// const DAY_ORDER: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];
//
// export function CafeDetailsScreen() {
//     const navigation = useNavigation<RootStackNavigationProp>();
//     const route = useRoute<RouteProp<RootStackParamList, 'CafeDetails'>>();
//     const coffeeId = parseToCoffeeId(route.params.id);
//     const { coffee } = useCafeFull(coffeeId);
//     const isOpen = useCafeOpenNow(coffeeId);
//
//     const [showAllHours, setShowAllHours] = useState(false);
//
//     const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex;
//
//     const todayHoursLabel = coffee?.hours?.[todayIndex]?.label ?? 'Horaires non disponibles';
//     const hasHours = coffee?.hours != null;
//
//     const openColor = isOpen ? '#34C759' : '#FF3B30';
//     const openBackground = isOpen ? 'rgba(52,199,89,0.14)' : 'rgba(255,59,48,0.16)';
//     const openIcon = isOpen ? 'sun.max.fill' : 'moon.zzz';
//     const openText = isOpen ? 'Ouvert actuellement' : 'Actuellement fermé';
//
//     const handleClose = () => {
//         navigation.goBack();
//     };
//
//     const handleCall = () => {
//         if (!coffee?.phoneNumber) return;
//         const raw = coffee.phoneNumber.replace(/\s+/g, '');
//         Linking.openURL(`tel:${raw}`);
//     };
//
//     const handleOpenWebsite = () => {
//         if (!coffee?.website) return;
//         const url = /^https?:\/\//i.test(coffee.website) ? coffee.website : `https://${coffee.website}`;
//         Linking.openURL(url);
//     };
//
//     const hoursRows = useMemo(() => {
//         if (!coffee?.hours) return [] as { key: DayIndex; label: string; value: string }[];
//         return DAY_ORDER.map((day) => ({
//             key: day,
//             label: DAY_LABELS[day],
//             value: coffee.hours?.[day]?.label ?? 'Horaires non communiqués',
//         }));
//     }, [coffee?.hours]);
//
//     if (!coffee) {
//         return (
//             <SafeAreaView style={styles.safeArea}>
//                 <View style={styles.loaderWrapper}>
//                     <Text style={styles.errorText}>Ce café n’a pas pu être chargé.</Text>
//                     <Pressable onPress={handleClose} style={styles.retryButton}>
//                         <Text style={styles.retryLabel}>Retour</Text>
//                     </Pressable>
//                 </View>
//             </SafeAreaView>
//         );
//     }
//
//     return (
//         <SafeAreaView style={styles.safeArea}>
//             <StatusBar barStyle="dark-content" />
//             <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//                 <View style={styles.topBar}>
//                     <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12} accessibilityRole={'button'}>
//                         <SymbolView name={'xmark'} size={18} tintColor={'#1C1C1E'} />
//                     </Pressable>
//                 </View>
//                 <View style={styles.heroCard}>
//                     <Image
//                         source={coffee.photos[0]}
//                         style={styles.heroImage}
//                         contentFit={'cover'}
//                     />
//                     <View style={styles.heroContent}>
//                         <View style={styles.heroTextWrapper}>
//                             <Text style={styles.heroTitle}>{coffee.name}</Text>
//                             {coffee.address?.line1 ? (
//                                 <Text style={styles.heroSubtitle}>{coffee.address.line1}</Text>
//                             ) : null}
//                             <Text style={styles.heroSecondary}>
//                                 {[coffee.address?.postalCode, coffee.address?.city].filter(Boolean).join(' ')}
//                             </Text>
//                         </View>
//                         <View style={[styles.statusBadge, { backgroundColor: openBackground }] }>
//                             <SymbolView name={openIcon} size={16} tintColor={openColor} />
//                             <Text style={[styles.statusText, { color: openColor }]}>{openText}</Text>
//                         </View>
//                     </View>
//                 </View>
//
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Photos</Text>
//                     <FlatList
//                         horizontal
//                         data={coffee.photos}
//                         keyExtractor={(_, index) => `${index}`}
//                         renderItem={({ item }) => (
//                             <Image source={item} style={styles.photoItem} contentFit={'cover'} />
//                         )}
//                         showsHorizontalScrollIndicator={false}
//                         contentContainerStyle={styles.photoList}
//                         ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
//                     />
//                 </View>
//
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Coordonnées</Text>
//                     <View style={styles.infoCard}>
//                         {coffee.phoneNumber ? (
//                             <Pressable style={styles.infoRow} onPress={handleCall} accessibilityRole={'button'}>
//                                 <View style={styles.iconCircle}>
//                                     <SymbolView name={'phone.fill'} size={16} tintColor={'#1C1C1E'} />
//                                 </View>
//                                 <View style={styles.infoTextWrapper}>
//                                     <Text style={styles.infoLabel}>Téléphone</Text>
//                                     <Text style={styles.infoValue}>{coffee.phoneNumber}</Text>
//                                 </View>
//                                 <SymbolView name={'arrow.up.right'} size={14} tintColor={'#8E8E93'} />
//                             </Pressable>
//                         ) : null}
//                         {coffee.website ? (
//                             <Pressable style={styles.infoRow} onPress={handleOpenWebsite} accessibilityRole={'link'}>
//                                 <View style={styles.iconCircle}>
//                                     <SymbolView name={'globe'} size={16} tintColor={'#1C1C1E'} />
//                                 </View>
//                                 <View style={styles.infoTextWrapper}>
//                                     <Text style={styles.infoLabel}>Site internet</Text>
//                                     <Text style={styles.infoValue} numberOfLines={1}>{coffee.website}</Text>
//                                 </View>
//                                 <SymbolView name={'arrow.up.right'} size={14} tintColor={'#8E8E93'} />
//                             </Pressable>
//                         ) : null}
//                         <View style={styles.infoRowStatic}>
//                             <View style={styles.iconCircle}>
//                                 <SymbolView name={'mappin.and.ellipse'} size={16} tintColor={'#1C1C1E'} />
//                             </View>
//                             <View style={styles.infoTextWrapper}>
//                                 <Text style={styles.infoLabel}>Adresse</Text>
//                                 {coffee.address?.line1 ? (
//                                     <Text style={styles.infoValue}>{coffee.address.line1}</Text>
//                                 ) : null}
//                                 <Text style={styles.infoValue}>
//                                     {[coffee.address?.postalCode, coffee.address?.city].filter(Boolean).join(' ')}
//                                 </Text>
//                             </View>
//                         </View>
//                     </View>
//                 </View>
//
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Horaires</Text>
//                     <View style={styles.hoursCard}>
//                         <View style={styles.hoursHeader}>
//                             <Text style={styles.hoursTitle}>Aujourd’hui</Text>
//                             <Text style={styles.hoursValue}>{todayHoursLabel}</Text>
//                         </View>
//                         {hasHours ? (
//                             <Pressable onPress={() => setShowAllHours((value) => !value)} style={styles.toggleHours}>
//                                 <Text style={styles.toggleHoursText}>
//                                     {showAllHours ? 'Masquer les horaires' : 'Voir tous les horaires'}
//                                 </Text>
//                             </Pressable>
//                         ) : null}
//                         {showAllHours && hasHours ? (
//                             <View style={styles.hoursList}>
//                                 {hoursRows.map((row) => (
//                                     <View key={row.key} style={styles.hoursRow}>
//                                         <Text style={styles.hoursLabel}>{row.label}</Text>
//                                         <Text style={styles.hoursValue}>{row.value}</Text>
//                                     </View>
//                                 ))}
//                             </View>
//                         ) : null}
//                     </View>
//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     );
// }
//
// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#FFFFFF',
//     },
//     scrollContent: {
//         paddingBottom: 48,
//     },
//     loaderWrapper: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingHorizontal: 24,
//     },
//     errorText: {
//         textAlign: 'center',
//         fontSize: 16,
//         color: '#5B5B5B',
//     },
//     retryButton: {
//         marginTop: 16,
//         backgroundColor: '#1C1C1E',
//         paddingHorizontal: 20,
//         paddingVertical: 10,
//         borderRadius: 24,
//     },
//     retryLabel: {
//         color: '#FFFFFF',
//         fontWeight: '600',
//     },
//     topBar: {
//         alignItems: 'flex-end',
//         paddingHorizontal: 24,
//         paddingTop: 12,
//     },
//     closeButton: {
//         marginBottom:10,
//         borderWidth:1,
//         borderColor:palette.primary_90,
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: 'rgba(255,255,255,0.85)',
//         alignItems: 'center',
//         justifyContent: 'center',
//         shadowColor: '#000',
//         shadowOpacity: 0.15,
//         shadowRadius: 8,
//         shadowOffset: { width: 0, height: 4 },
//     },
//     heroCard: {
//         borderBottomLeftRadius: 32,
//         borderBottomRightRadius: 32,
//         overflow: 'hidden',
//         backgroundColor: '#F6F6F6',
//     },
//     heroImage: {
//         width: '100%',
//         height: 240,
//     },
//     heroContent: {
//         padding: 24,
//         gap: 16,
//     },
//     heroTextWrapper: {
//         gap: 6,
//     },
//     heroTitle: {
//         fontSize: 28,
//         fontWeight: '700',
//         color: '#1C1C1E',
//     },
//     heroSubtitle: {
//         fontSize: 15,
//         color: '#6E6E73',
//     },
//     heroSecondary: {
//         fontSize: 14,
//         color: '#8E8E93',
//     },
//     statusBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         alignSelf: 'flex-start',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 16,
//     },
//     statusText: {
//         fontSize: 14,
//         fontWeight: '600',
//     },
//     section: {
//         paddingHorizontal: 24,
//         paddingTop: 24,
//         gap: 12,
//     },
//     sectionTitle: {
//         fontSize: 22,
//         fontWeight: '700',
//         color: '#1C1C1E',
//     },
//     photoList: {
//         paddingVertical: 12,
//     },
//     photoItem: {
//         width: 180,
//         height: 120,
//         borderRadius: 16,
//         backgroundColor: '#EAEAEA',
//     },
//     infoCard: {
//         backgroundColor: '#FFFFFF',
//         borderRadius: 20,
//         padding: 20,
//         gap: 12,
//         shadowColor: '#000',
//         shadowOpacity: 0.05,
//         shadowRadius: 12,
//         shadowOffset: { width: 0, height: 6 },
//     },
//     infoRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         gap: 12,
//         paddingVertical: 8,
//     },
//     infoRowStatic: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//         gap: 12,
//         paddingVertical: 8,
//     },
//     iconCircle: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: '#F2F2F7',
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     infoTextWrapper: {
//         flex: 1,
//         gap: 2,
//     },
//     infoLabel: {
//         fontSize: 13,
//         color: '#6B6B6B',
//         textTransform: 'uppercase',
//         letterSpacing: 0.6,
//     },
//     infoValue: {
//         fontSize: 15,
//         color: '#1C1C1E',
//     },
//     hoursCard: {
//         backgroundColor: '#FFFFFF',
//         borderRadius: 20,
//         padding: 20,
//         gap: 16,
//         shadowColor: '#000',
//         shadowOpacity: 0.05,
//         shadowRadius: 12,
//         shadowOffset: { width: 0, height: 6 },
//     },
//     hoursHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },
//     hoursTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#1C1C1E',
//     },
//     hoursValue: {
//         fontSize: 14,
//         color: '#6E6E73',
//     },
//     toggleHours: {
//         alignSelf: 'flex-start',
//         paddingVertical: 6,
//         paddingHorizontal: 12,
//         borderRadius: 12,
//         backgroundColor: '#F2F2F7',
//     },
//     toggleHoursText: {
//         color: '#3A3A3C',
//         fontWeight: '600',
//     },
//     hoursList: {
//         gap: 12,
//     },
//     hoursRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//     },
//     hoursLabel: {
//         fontSize: 14,
//         color: '#1C1C1E',
//     },
// });
//
// export default CafeDetailsScreen;
