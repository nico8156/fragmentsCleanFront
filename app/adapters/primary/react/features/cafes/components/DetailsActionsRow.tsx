import { palette } from "@/app/adapters/primary/react/css/colors";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useMemo } from "react";
import { LayoutChangeEvent, Linking, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";

export function DetailsActionsRow({
	coffee,
	addressLine,
	compact,
	onLayout,
}: {
	coffee: any;
	addressLine: string;
	compact?: boolean;
	onLayout?: (e: LayoutChangeEvent) => void;
}) {
	const phoneNumber: string | undefined = (coffee as any).phoneNumber;
	const website: string | undefined = (coffee as any).website;

	const onPressItinerary = useCallback(async () => {
		const lat = coffee?.location?.lat;
		const lon = coffee?.location?.lon;
		const label = encodeURIComponent(coffee?.name ?? "Café");

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

		if (addressLine) {
			return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`);
		}
	}, [coffee?.location?.lat, coffee?.location?.lon, coffee?.name, addressLine]);

	const onPressFollow = useCallback(() => {
		// TODO: brancher wishlist/follow
	}, []);

	const onPressCall = useCallback(async () => {
		if (!phoneNumber) return;
		const url = `tel:${phoneNumber}`;
		const can = await Linking.canOpenURL(url);
		if (can) Linking.openURL(url);
	}, [phoneNumber]);

	const onPressShare = useCallback(async () => {
		const msg = `${coffee?.name ?? "Café"}\n${addressLine}${website ? `\n${website}` : ""}`;
		await Share.share({ message: msg });
	}, [coffee?.name, addressLine, website]);

	const items = useMemo(
		() =>
			[
				{ key: "itinerary", icon: "figure.walk", label: "Itinéraire", onPress: onPressItinerary, kind: "primary" as const, disabled: false },
				{ key: "follow", icon: "plus", label: "Suivre", onPress: onPressFollow, kind: "neutral" as const, disabled: false },
				{ key: "call", icon: "phone", label: "Appeler", onPress: onPressCall, kind: "neutral" as const, disabled: !phoneNumber },
				{ key: "share", icon: "square.and.arrow.up", label: "Partager", onPress: onPressShare, kind: "neutral" as const, disabled: false },
			] as const,
		[onPressItinerary, onPressFollow, onPressCall, onPressShare, phoneNumber],
	);

	return (
		<View onLayout={onLayout} style={[s.row, compact && s.rowCompact]}>
			{items.map((it) => (
				<ActionItem
					key={it.key}
					icon={it.icon}
					label={it.label}
					kind={it.kind}
					compact={compact}
					disabled={it.disabled}
					onPress={it.onPress}
				/>
			))}
		</View>
	);
}

function ActionItem({
	icon,
	label,
	kind,
	compact,
	disabled,
	onPress,
}: {
	icon: string;
	label: string;
	kind: "primary" | "neutral";
	compact?: boolean;
	disabled?: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={({ pressed }) => [
				s.item,
				compact && s.itemCompact,
				pressed && !disabled && s.pressed,
				disabled && s.disabled,
			]}
		>
			<View style={[s.button, compact && s.buttonCompact, kind === "primary" ? s.buttonPrimary : s.buttonNeutral]}>
				<View style={[s.iconBubble, compact && s.iconBubbleCompact, kind === "primary" ? s.iconBubblePrimary : s.iconBubbleNeutral]}>
					<SymbolView name={icon as any} size={compact ? 16 : 18} tintColor={palette.textPrimary} fallback={<Text>•</Text>} />
				</View>
			</View>

			<Text style={[s.label, compact && s.labelCompact, disabled && s.labelDisabled]} numberOfLines={1}>
				{label}
			</Text>
		</Pressable>
	);
}

const H_SPACING = 10; // espace horizontal entre items (robuste sans gap)

const s = StyleSheet.create({
	// ✅ container ligne: pas de wrap, distribution stable
	row: {
		paddingHorizontal: 16,
		paddingTop: 10,
		paddingBottom: 6,
		flexDirection: "row",
		flexWrap: "nowrap",
		justifyContent: "space-between",
		// remplace gap
		marginHorizontal: -H_SPACING / 2,
	},
	rowCompact: {
		paddingHorizontal: 0,
		paddingTop: 0,
		paddingBottom: 0,
		marginHorizontal: -H_SPACING / 2,
	},

	// Chaque item = 1/4 largeur, avec padding pour créer l'espace
	item: {
		flex: 1,
		minWidth: 0,
		alignItems: "center",
		paddingHorizontal: H_SPACING / 2,
		paddingVertical: 0,
	},
	itemCompact: {
		paddingHorizontal: H_SPACING / 2,
	},

	button: {
		width: "100%",
		height: 46,
		borderRadius: 18,
		backgroundColor: palette.elevated,
		borderWidth: 1,
		borderColor: palette.border_muted_30,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonCompact: { height: 42, borderRadius: 16 },

	buttonNeutral: {
		backgroundColor: palette.elevated,
		borderColor: palette.border_muted_30,
	},
	buttonPrimary: {
		backgroundColor: palette.accentSoft,
		borderColor: palette.accent_30,
	},

	iconBubble: {
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
	},
	iconBubbleCompact: { width: 28, height: 28, borderRadius: 14 },

	iconBubbleNeutral: {
		backgroundColor: palette.bg_dark_50,
		borderColor: palette.border_muted_30,
	},
	iconBubblePrimary: {
		backgroundColor: palette.primary_30,
		borderColor: palette.accent_30,
	},

	label: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: "900",
		color: palette.textSecondary,
		letterSpacing: 0.2,
	},
	labelCompact: { marginTop: 6, fontSize: 11 },
	labelDisabled: { color: palette.textMuted },

	disabled: { opacity: 0.45 },
	pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});

