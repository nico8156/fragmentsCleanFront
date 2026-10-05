import { palette } from "@/app/adapters/primary/react/css/colors";
import { openCoffeeDirections } from "@/app/adapters/primary/react/features/cafes/coffeeDirections";
import { FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { spacing, surfaces, radii } from "@/app/adapters/primary/react/css/designTokens";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";

export function DetailsActionsRow({
	coffee,
	addressLine,
	saved,
}: {
	coffee: any;
	addressLine: string;
	saved?: {
		saved: boolean;
		pending?: boolean;
		onToggle: () => void;
	};
}) {
	const phoneNumber: string | undefined = (coffee as any).phoneNumber;
	const website: string | undefined = (coffee as any).website;

	const onPressItinerary = useCallback(async () => {
		await openCoffeeDirections({ latitude: coffee?.location?.lat, longitude: coffee?.location?.lon, label: coffee?.name, addressLine });
	}, [coffee?.location?.lat, coffee?.location?.lon, coffee?.name, addressLine]);

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
				{
					key: "save",
					icon: saved?.saved ? "bookmark.fill" : "bookmark",
					label: saved?.saved ? "Favori" : "Ajouter",
					accessibilityLabel: saved?.pending
						? "Mise à jour du favori en cours"
						: saved?.saved
							? "Retirer ce café des favoris"
							: "Ajouter ce café aux favoris",
					onPress: saved?.onToggle ?? (() => undefined),
					kind: saved?.saved ? "primary" as const : "neutral" as const,
					disabled: !saved || Boolean(saved?.pending),
				},
				{ key: "call", icon: "phone", label: "Appeler", onPress: onPressCall, kind: "neutral" as const, disabled: !phoneNumber },
				{ key: "share", icon: "square.and.arrow.up", label: "Partager", onPress: onPressShare, kind: "neutral" as const, disabled: false },
			] as const,
		[onPressItinerary, saved, onPressCall, onPressShare, phoneNumber],
	);

	return (
		<View style={s.row}>
			{items.map((it) => (
				<ActionItem
					key={it.key}
					icon={it.icon}
					label={it.label}
					kind={it.kind}
					disabled={it.disabled}
					accessibilityLabel={"accessibilityLabel" in it ? it.accessibilityLabel : it.label}
					pending={it.key === "save" ? saved?.pending : false}
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
	disabled,
	accessibilityLabel,
	pending,
	onPress,
}: {
	icon: string;
	label: string;
	kind: "primary" | "neutral";
	disabled?: boolean;
	accessibilityLabel: string;
	pending?: boolean;
	onPress: () => void;
}) {
	if (kind === "primary" && icon === "figure.walk") {
		return <FragmentsButton label={label} onPress={onPress} disabled={disabled} style={s.primary} />;
	}
	return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
		accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled, busy: pending }}
		style={({ pressed }) => [s.icon, disabled && s.disabled, pressed && !disabled && s.pressed]}>
		{pending ? <ActivityIndicator size="small" color={palette.accent} /> :
			<SymbolView name={icon as any} size={20} tintColor={kind === "primary" ? palette.accent : palette.textSecondary} fallback={<Text style={s.fallback}>{label}</Text>} />}
	</Pressable>;
}

const s = StyleSheet.create({
	row: { paddingHorizontal: spacing.standard, paddingTop: spacing.standard, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.micro },
	primary: { flexGrow: 1, flexBasis: 120 },
	icon: { minWidth: 44, minHeight: 44, borderRadius: radii.round, padding: spacing.compact, backgroundColor: surfaces.card, alignItems: "center", justifyContent: "center" },
	fallback: { color: palette.textSecondary },
	disabled: { opacity: 0.45 },
	pressed: { opacity: 0.75 },
});
