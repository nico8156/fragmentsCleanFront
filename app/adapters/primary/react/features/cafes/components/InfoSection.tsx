import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import { SymbolView } from "expo-symbols";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Section } from "./Section";

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

export function InfoSection({
	coffee,
	addressLine,
}: {
	coffee: any;
	addressLine: string;
}) {
	return (
		<Section title="Informations pratiques">
		<View style={s.wrap}>
			<InfoRow icon="mappin.and.ellipse" fallback="📍" title="Adresse" value={addressLine || "—"} />
			{!!coffee?.phoneNumber ? (
				<InfoRow icon="phone.fill" fallback="☎" title="Téléphone" value={coffee.phoneNumber} />
			) : null}
			{!!coffee?.website ? (
				<InfoRow icon="globe" fallback="🌐" title="Site" value={coffee.website} />
			) : null}

			<OpeningHoursBlock hours={coffee?.hours} />
		</View>
		</Section>
	);
}

function InfoRow({
	icon,
	fallback,
	title,
	value,
}: {
	icon: string;
	fallback: string;
	title: string;
	value: string;
}) {
	return (
		<View style={s.row}>
			<View style={s.icon}>
				<SymbolView
					name={icon as any}
					size={16}
					tintColor={palette.textMuted}
					fallback={<Text style={{ color: palette.textMuted }}>{fallback}</Text>}
				/>
			</View>
			<View style={{ flex: 1 }}>
				<Text style={s.title}>{title}</Text>
				<Text style={s.value}>
					{value}
				</Text>
			</View>
		</View>
	);
}

function OpeningHoursBlock({
	hours,
}: {
	hours?: { label?: string }[];
}) {
	const [open, setOpen] = useState(false);

	const todayIndex = useMemo(() => ((new Date().getDay() + 6) % 7) as DayIndex, []);
	const todayLabel = hours?.[todayIndex]?.label ?? "Horaires non disponibles";

	return (
		<View style={{ marginTop: 12 }}>
			<Pressable accessibilityRole="button" accessibilityLabel="Horaires de la semaine" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={s.hoursCard} hitSlop={8}>
				<View style={s.icon}>
					<SymbolView
						name="clock"
						size={16}
						tintColor={palette.textMuted}
						fallback={<Text style={{ color: palette.textMuted }}>⏰</Text>}
					/>
				</View>

				<View style={{ flex: 1 }}>
					<Text style={s.title}>Horaires • Aujourd’hui ({dayNames[todayIndex]})</Text>
					<Text style={s.value}>
						{todayLabel}
					</Text>
				</View>

				<SymbolView
					name={open ? "chevron.up" : "chevron.down"}
					size={14}
					tintColor={palette.textMuted}
					fallback={<Text style={{ color: palette.textMuted }}>{open ? "˄" : "˅"}</Text>}
				/>
			</Pressable>

			{open ? (
				<View style={{ marginTop: 10, gap: 8 }}>
					{dayNames.map((d, idx) => {
						const label = hours?.[idx]?.label ?? "—";
						return (
							<View key={d} style={s.dayCard}>
								<Text style={s.dayTitle}>{d}</Text>
								<Text style={s.dayValue}>{label}</Text>
							</View>
						);
					})}
				</View>
			) : null}
		</View>
	);
}

const s = StyleSheet.create({
	wrap: { gap: spacing.micro },
	row: { flexDirection: "row", gap: spacing.compact, alignItems: "flex-start", paddingVertical: 4 },
	icon: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
	title: { ...typography.body, color: palette.textMuted },
	value: { ...typography.body, color: palette.textPrimary, marginTop: 2 },
	hoursCard: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.compact },
	dayCard: { flexDirection: "row", gap: spacing.compact, paddingVertical: 4, paddingLeft: 36 },
	dayTitle: { ...typography.body, color: palette.textSecondary, width: 44 },
	dayValue: { ...typography.body, color: palette.textPrimary, flex: 1 },
});
