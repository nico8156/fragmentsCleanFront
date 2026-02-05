import { palette } from "@/app/adapters/primary/react/css/colors";
import { SymbolView } from "expo-symbols";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Section } from "./Section";

export function InfoSection({ coffee, addressLine }: { coffee: any; addressLine: string }) {
	const priceLabel: string | undefined = (coffee as any).priceLabel;
	const website: string | undefined = (coffee as any).website;
	const phoneNumber: string | undefined = (coffee as any).phoneNumber;

	return (
		<Section title="Infos">
			<InfoLine icon="mappin.and.ellipse" text={addressLine || "Adresse indisponible"} />
			{!!priceLabel ? <InfoLine icon="eurosign" text={priceLabel} /> : null}
			{!!website ? <InfoLine icon="link" text={website} /> : null}
			{!!phoneNumber ? <InfoLine icon="phone" text={phoneNumber} /> : null}
		</Section>
	);
}

function InfoLine({ icon, text }: { icon: string; text: string }) {
	return (
		<View style={s.line}>
			<SymbolView name={icon as any} size={18} tintColor={palette.textMuted} fallback={<Text>•</Text>} />
			<Text style={s.text} numberOfLines={2}>
				{text}
			</Text>
		</View>
	);
}

const s = StyleSheet.create({
	line: { flexDirection: "row", alignItems: "center", gap: 10 },
	text: { flex: 1, fontSize: 14, fontWeight: "750", color: palette.textPrimary_1 },
});

