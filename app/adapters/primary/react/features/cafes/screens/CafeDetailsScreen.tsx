import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Keyboard,
	KeyboardEvent,
	LayoutChangeEvent,
	Linking,
	Platform,
	Pressable,
	Share,
	StyleSheet,
	Text,
	TextInput,
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

import { palette } from "@/app/adapters/primary/react/css/colors";
import {
	RootStackNavigationProp,
	RootStackParamList,
} from "@/app/adapters/primary/react/navigation/types";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

// ✅ Hooks branchés
import { useCommentsForCafe } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { useLikesForCafe } from "@/app/adapters/secondary/viewModel/useLikesForCafe";

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

	// ✅ Likes + Comments connectés
	const likes = useLikesForCafe(coffeeId ?? undefined);
	const commentsVM = useCommentsForCafe(coffeeId ?? undefined);

	const commentCount = commentsVM.comments.length;

	// --- Keyboard handling (stable, no KAV)
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
					<ActivityIndicator />
					<Text style={styles.loadingText}>Chargement…</Text>
				</View>
			</SafeAreaView>
		);
	}

	// --- Derivations
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

	const phoneNumber: string | undefined = (coffee as any).phoneNumber;
	const website: string | undefined = (coffee as any).website;

	const status = useMemo(() => {
		if (isOpenNow === undefined) return { label: "STATUT", value: "—" };
		return isOpenNow ? { label: "OUVERT", value: todayHoursLabel } : { label: "FERMÉ", value: todayHoursLabel };
	}, [isOpenNow, todayHoursLabel]);

	// --- Anim / scroll
	const scrollY = useSharedValue(0);
	const actionsThreshold = useSharedValue(180);
	const scrollRef = useRef<any>(null);
	const commentInputRef = useRef<TextInput>(null);
	const [commentDraft, setCommentDraft] = useState("");

	const onScroll = useAnimatedScrollHandler({
		onScroll: (e) => {
			scrollY.value = e.contentOffset.y;
		},
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
		const { y } = e.nativeEvent.layout;
		actionsThreshold.value = y + 40;
	};

	// --- Handlers
	const onPressBack = () => navigation.goBack();

	const onPressItinerary = useCallback(async () => {
		const lat = coffee.location?.lat;
		const lon = coffee.location?.lon;
		const label = encodeURIComponent(coffee.name ?? "Café");

		// Map deep links
		if (lat != null && lon != null) {
			const url = Platform.select({
				ios: `maps:0,0?q=${label}@${lat},${lon}`,
				android: `geo:0,0?q=${lat},${lon}(${label})`,
				default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
			})!;
			const can = await Linking.canOpenURL(url);
			if (can) return Linking.openURL(url);
			return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
		}

		// fallback address
		if (addressLine) {
			return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`);
		}
	}, [coffee.location?.lat, coffee.location?.lon, coffee.name, addressLine]);

	const onPressCall = useCallback(async () => {
		if (!phoneNumber) return;
		const url = `tel:${phoneNumber}`;
		const can = await Linking.canOpenURL(url);
		if (can) Linking.openURL(url);
	}, [phoneNumber]);

	const onPressShare = useCallback(async () => {
		const url = website ?? "";
		const msg = `${coffee.name}\n${addressLine}${url ? `\n${url}` : ""}`;
		await Share.share({ message: msg });
	}, [coffee.name, addressLine, website]);

	const onPressFollow = useCallback(() => {
		// TODO: brancher ton follow/wishlist
		// pour l’instant : feedback UI plus tard
	}, []);

	const onPressLike = useCallback(() => {
		likes.toggleLike();
	}, [likes]);

	const focusComment = useCallback(() => {
		requestAnimationFrame(() => commentInputRef.current?.focus());
	}, []);

	const submitComment = useCallback(() => {
		const txt = commentDraft.trim();
		if (!txt || !coffeeId) return;
		commentsVM.uiViaHookCreateComment({ targetId: String(coffeeId), body: txt });
		setCommentDraft("");
		Keyboard.dismiss();
	}, [commentDraft, commentsVM, coffeeId]);

	const refreshAll = useCallback(() => {
		likes.refresh();
		// comments hook refresh auto-stale, mais on peut forcer un fetch en jouant côté usecase
		// si tu ajoutes un "refresh()" dans ton hook comments plus tard.
	}, [likes]);

	// When keyboard opens, ensure the input area is reachable
	useEffect(() => {
		if (keyboardHeight > 0) {
			requestAnimationFrame(() => scrollRef.current?.scrollToEnd?.({ animated: true }));
		}
	}, [keyboardHeight]);

	const showStickyActions = keyboardHeight === 0;

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

					<Pressable onPress={refreshAll} style={styles.navBtn} accessibilityLabel="Rafraîchir">
						<SymbolView
							name="arrow.clockwise"
							size={18}
							tintColor={palette.textPrimary_1}
							fallback={<Text>↻</Text>}
						/>
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
						{ paddingBottom: 120 + keyboardHeight },
					]}
				>
					{/* Hero card */}
					<View style={styles.heroCard}>
						<View style={styles.heroTop}>
							<View style={styles.heroLeft}>
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
									{!!addressLine ? (
										<Text style={styles.subtitle} numberOfLines={2}>
											{addressLine}
										</Text>
									) : null}
								</View>
							</View>

							{/* Metrics */}
							<View style={styles.heroRight}>
								<Pressable onPress={onPressLike} style={styles.metric}>
									<SymbolView
										name={likes.likedByMe ? "heart.fill" : "heart"}
										size={18}
										tintColor={likes.likedByMe ? "#E74C3C" : palette.textMuted}
										fallback={<Text>♥</Text>}
									/>
									<Text style={styles.metricText}>{likes.count}</Text>
								</Pressable>

								<Pressable onPress={focusComment} style={styles.metric}>
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

						{/* Status row */}
						<View style={styles.statusRow}>
							<View style={[styles.statusBadge, isOpenNow ? styles.statusOpen : styles.statusClosed]}>
								<Text style={styles.statusBadgeText}>{status.label}</Text>
							</View>
							<Text style={styles.statusText} numberOfLines={1}>
								{status.value}
							</Text>

							{(likes.isOptimistic || commentsVM.isRefreshing) && (
								<View style={styles.pill}>
									<ActivityIndicator size="small" />
									<Text style={styles.pillText}>Sync…</Text>
								</View>
							)}
						</View>
					</View>

					{/* Actions */}
					<View onLayout={onActionsLayout} style={styles.actionsRow}>
						<ActionButton variant="primary" icon="figure.walk" label="Itinéraire" onPress={onPressItinerary} />
						<ActionButton variant="outline" icon="plus" label="Suivre" onPress={onPressFollow} />
						<ActionButton
							variant="outline"
							icon="phone"
							label="Appeler"
							onPress={onPressCall}
							disabled={!phoneNumber}
						/>
						<ActionButton variant="outline" icon="square.and.arrow.up" label="Partager" onPress={onPressShare} />
					</View>

					{/* Photos */}
					<Section title="Photos">
						<View style={styles.carouselWrap}>
							<FlatList
								data={photos}
								keyExtractor={(uri, idx) => `${uri}-${idx}`}
								horizontal
								pagingEnabled
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
								renderItem={({ item }) => <Image source={{ uri: item }} style={styles.photo} />}
								ListEmptyComponent={
									<View style={[styles.photo, styles.photoEmpty]}>
										<Text style={styles.photoEmptyText}>Aucune photo</Text>
									</View>
								}
							/>
						</View>
					</Section>

					{/* Infos */}
					<Section title="Infos">
						<InfoLine icon="mappin.and.ellipse" text={addressLine || "Adresse indisponible"} />
						{!!priceLabel ? <InfoLine icon="eurosign" text={priceLabel} /> : null}
						{!!website ? <InfoLine icon="link" text={website} /> : null}
						{!!phoneNumber ? <InfoLine icon="phone" text={phoneNumber} /> : null}
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
					<Section title={`Commentaires (${commentCount})`}>
						{commentsVM.isLoading ? (
							<View style={styles.commentsLoading}>
								<ActivityIndicator />
								<Text style={styles.muted}>Chargement des commentaires…</Text>
							</View>
						) : commentsVM.error ? (
							<View style={styles.commentsLoading}>
								<Text style={styles.errorInline}>Erreur: {commentsVM.error}</Text>
							</View>
						) : commentCount === 0 ? (
							<View style={styles.emptyState}>
								<Text style={styles.emptyTitle}>Aucun commentaire</Text>
								<Text style={styles.emptyText}>Sois le premier à laisser un retour.</Text>
							</View>
						) : (
							<View style={{ gap: 10 }}>
								{commentsVM.comments.map((c) => (
									<CommentRow
										key={c.id}
										item={c}
										onEdit={(newBody) => commentsVM.uiViaHookUpdateComment({ commentId: c.id, body: newBody })}
										onDelete={() => commentsVM.uiViaHookDeleteComment({ commentId: c.id })}
									/>
								))}
							</View>
						)}

						{/* Composer */}
						<View style={styles.composer}>
							<View style={styles.composerTop}>
								<View style={styles.avatar}>
									<Text style={styles.avatarText}>🙂</Text>
								</View>

								<View style={{ flex: 1, gap: 8 }}>
									<TextInput
										ref={commentInputRef}
										value={commentDraft}
										onChangeText={setCommentDraft}
										placeholder="Ajouter un commentaire…"
										placeholderTextColor={palette.textMuted}
										style={styles.composerInput}
										multiline
										returnKeyType="default"
										blurOnSubmit={false}
									/>

									<View style={styles.composerActions}>
										<Text style={styles.hint}>
											{commentDraft.trim().length > 0 ? `${commentDraft.trim().length} caractères` : "Sois concis et utile"}
										</Text>

										<Pressable
											onPress={submitComment}
											disabled={!commentDraft.trim()}
											style={({ pressed }) => [
												styles.sendBtn,
												!commentDraft.trim() && styles.sendBtnDisabled,
												pressed && commentDraft.trim() ? styles.pressed : null,
											]}
										>
											<SymbolView
												name="paperplane.fill"
												size={16}
												tintColor="white"
												fallback={<Text>➤</Text>}
											/>
											<Text style={styles.sendBtnText}>Envoyer</Text>
										</Pressable>
									</View>
								</View>
							</View>
						</View>
					</Section>
				</Animated.ScrollView>

				{/* Sticky actions (disappear when keyboard open) */}
				{showStickyActions && (
					<Animated.View style={[styles.bottomBar, bottomBarStyle]}>
						<View style={styles.bottomBarInner}>
							<ActionButton variant="primary" icon="figure.walk" label="Itinéraire" onPress={onPressItinerary} compact />
							<ActionButton variant="outline" icon="plus" label="Suivre" onPress={onPressFollow} compact />
							<ActionButton
								variant="outline"
								icon="phone"
								label="Appeler"
								onPress={onPressCall}
								compact
								disabled={!phoneNumber}
							/>
							<ActionButton variant="outline" icon="square.and.arrow.up" label="Partager" onPress={onPressShare} compact />
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
	disabled,
}: {
	variant: "primary" | "outline";
	icon: string;
	label: string;
	onPress: () => void;
	compact?: boolean;
	disabled?: boolean;
}) {
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={({ pressed }) => [
				styles.actionBtn,
				compact && styles.actionBtnCompact,
				variant === "primary" ? styles.actionPrimary : styles.actionOutline,
				disabled && styles.actionDisabled,
				pressed && !disabled && styles.pressed,
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
					disabled && styles.actionTextDisabled,
				]}
				numberOfLines={1}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function CommentRow({
	item,
	onEdit,
	onDelete,
}: {
	item: {
		id: string;
		authorName: string;
		avatarUrl: string;
		body: string;
		relativeTime: string;
		isOptimistic: boolean;
		transportStatus: "pending" | "success" | "failed";
		isAuthor: boolean;
	};
	onEdit: (newBody: string) => void;
	onDelete: () => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(item.body);

	useEffect(() => {
		setDraft(item.body);
	}, [item.body]);

	const statusPill =
		item.transportStatus === "pending"
			? { text: "Envoi…", style: styles.commentPillPending }
			: item.transportStatus === "failed"
				? { text: "Échec", style: styles.commentPillFailed }
				: item.isOptimistic
					? { text: "Sync", style: styles.commentPillPending }
					: null;

	const save = () => {
		const txt = draft.trim();
		if (!txt || txt === item.body) {
			setIsEditing(false);
			setDraft(item.body);
			return;
		}
		onEdit(txt);
		setIsEditing(false);
	};

	return (
		<View style={styles.commentRow}>
			<Image source={{ uri: item.avatarUrl }} style={styles.commentAvatar} />

			<View style={{ flex: 1, gap: 6 }}>
				<View style={styles.commentHeader}>
					<Text style={styles.commentAuthor} numberOfLines={1}>
						{item.authorName}
					</Text>

					<Text style={styles.commentTime}>{item.relativeTime}</Text>

					{statusPill ? (
						<View style={[styles.commentPill, statusPill.style]}>
							<Text style={styles.commentPillText}>{statusPill.text}</Text>
						</View>
					) : null}
				</View>

				{!isEditing ? (
					<Text style={styles.commentBody}>{item.body}</Text>
				) : (
					<View style={{ gap: 8 }}>
						<TextInput
							value={draft}
							onChangeText={setDraft}
							style={styles.commentEditInput}
							multiline
							placeholder="Modifier le commentaire…"
							placeholderTextColor={palette.textMuted}
						/>
						<View style={styles.commentEditActions}>
							<Pressable onPress={() => { setIsEditing(false); setDraft(item.body); }} style={styles.commentMiniBtn}>
								<Text style={styles.commentMiniBtnText}>Annuler</Text>
							</Pressable>
							<Pressable onPress={save} style={[styles.commentMiniBtn, styles.commentMiniBtnPrimary]}>
								<Text style={[styles.commentMiniBtnText, styles.commentMiniBtnTextPrimary]}>Enregistrer</Text>
							</Pressable>
						</View>
					</View>
				)}

				{item.isAuthor && !isEditing ? (
					<View style={styles.commentActions}>
						<Pressable onPress={() => setIsEditing(true)} style={styles.commentActionBtn}>
							<Text style={styles.commentActionText}>Modifier</Text>
						</Pressable>
						<Pressable onPress={onDelete} style={styles.commentActionBtn}>
							<Text style={[styles.commentActionText, styles.commentActionDanger]}>Supprimer</Text>
						</Pressable>
					</View>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: palette.background_1 },
	screen: { flex: 1, backgroundColor: palette.background_1 },
	center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
	loadingText: { marginTop: 10, color: palette.textMuted, fontWeight: "800" },

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
	navTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 16,
		fontWeight: "800",
		color: palette.textPrimary_1,
		paddingHorizontal: 10,
	},

	content: { paddingBottom: 20 },

	heroCard: {
		marginHorizontal: 16,
		marginTop: 10,
		borderRadius: 22,
		padding: 14,
		backgroundColor: "rgba(0,0,0,0.03)",
		gap: 12,
	},
	heroTop: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 12,
	},
	heroLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },
	heroRight: { flexDirection: "row", gap: 14, alignItems: "center" },

	logoWrap: { width: 46, height: 46, borderRadius: 23, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.06)" },
	logo: { width: 46, height: 46 },
	logoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
	logoPlaceholderText: { fontSize: 18 },

	brandLabel: { fontSize: 12, fontWeight: "900", color: "#7DB6FF", letterSpacing: 1 },
	title: { fontSize: 24, fontWeight: "900", color: palette.textPrimary_1, letterSpacing: -0.4 },
	subtitle: { fontSize: 13, fontWeight: "700", color: palette.textMuted, marginTop: 2 },

	metric: { flexDirection: "row", alignItems: "center", gap: 6 },
	metricText: { fontSize: 14, fontWeight: "900", color: palette.textPrimary_1 },

	statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
	statusOpen: { backgroundColor: "rgba(76, 175, 80, 0.18)" },
	statusClosed: { backgroundColor: "rgba(231, 76, 60, 0.16)" },
	statusBadgeText: { fontSize: 12, fontWeight: "900", color: palette.textPrimary_1, letterSpacing: 0.8 },
	statusText: { flex: 1, fontSize: 13, fontWeight: "800", color: palette.textPrimary_1, opacity: 0.85 },

	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	pillText: { fontSize: 12, fontWeight: "900", color: palette.textMuted },

	actionsRow: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 8,
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
	actionDisabled: { opacity: 0.45 },
	actionTextDisabled: { opacity: 0.85 },

	carouselWrap: { paddingTop: 2 },
	photo: { width: 280, height: 190, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.06)" },
	photoEmpty: { alignItems: "center", justifyContent: "center" },
	photoEmptyText: { color: palette.textMuted, fontWeight: "800" },

	section: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
	sectionTitle: { fontSize: 20, fontWeight: "900", color: "#4CAF50" },
	sectionCard: { borderRadius: 18, backgroundColor: "rgba(0,0,0,0.03)", padding: 14, gap: 12 },

	line: { flexDirection: "row", alignItems: "center", gap: 10 },
	lineText: { flex: 1, fontSize: 14, fontWeight: "750", color: palette.textPrimary_1 },

	tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	tag: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
	},
	tagText: { fontSize: 14, fontWeight: "850", color: palette.textPrimary_1 },

	commentsLoading: { flexDirection: "row", alignItems: "center", gap: 10 },
	muted: { color: palette.textMuted, fontWeight: "800" },
	errorInline: { color: "#E74C3C", fontWeight: "900" },

	emptyState: { paddingVertical: 6, gap: 4 },
	emptyTitle: { fontWeight: "900", color: palette.textPrimary_1 },
	emptyText: { fontWeight: "700", color: palette.textMuted },

	commentRow: { flexDirection: "row", gap: 10, paddingVertical: 6 },
	commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.06)" },
	commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
	commentAuthor: { fontSize: 14, fontWeight: "900", color: palette.textPrimary_1, maxWidth: 170 },
	commentTime: { fontSize: 12, fontWeight: "800", color: palette.textMuted },

	commentPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
	commentPillText: { fontSize: 12, fontWeight: "900", color: palette.textPrimary_1 },
	commentPillPending: { backgroundColor: "rgba(0,0,0,0.06)" },
	commentPillFailed: { backgroundColor: "rgba(231, 76, 60, 0.18)" },

	commentBody: { fontSize: 14, fontWeight: "700", color: palette.textPrimary_1, lineHeight: 19 },

	commentActions: { flexDirection: "row", gap: 14, paddingTop: 2 },
	commentActionBtn: { paddingVertical: 4 },
	commentActionText: { fontSize: 13, fontWeight: "900", color: palette.textMuted },
	commentActionDanger: { color: "#E74C3C" },

	commentEditInput: {
		minHeight: 60,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.10)",
		backgroundColor: "white",
		padding: 12,
		color: palette.textPrimary_1,
		fontWeight: "700",
	},
	commentEditActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
	commentMiniBtn: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	commentMiniBtnPrimary: { backgroundColor: "#4CAF50" },
	commentMiniBtnText: { fontWeight: "900", color: palette.textPrimary_1 },
	commentMiniBtnTextPrimary: { color: "white" },

	composer: {
		marginTop: 12,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
		backgroundColor: "white",
		padding: 12,
	},
	composerTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(0,0,0,0.06)",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: { fontSize: 16 },
	composerInput: {
		minHeight: 44,
		maxHeight: 140,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: "rgba(0,0,0,0.03)",
		color: palette.textPrimary_1,
		fontWeight: "700",
	},
	composerActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	hint: { fontSize: 12, fontWeight: "800", color: palette.textMuted },

	sendBtn: {
		height: 40,
		borderRadius: 14,
		paddingHorizontal: 12,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#4CAF50",
	},
	sendBtnDisabled: { backgroundColor: "rgba(0,0,0,0.18)" },
	sendBtnText: { fontSize: 14, fontWeight: "900", color: "white" },

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
	bottomBarInner: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },

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
});
