import { palette } from "@/app/adapters/primary/react/css/colors";
import { SymbolView } from "expo-symbols";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
				<Text style={s.value} numberOfLines={3}>
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
			<Pressable onPress={() => setOpen((v) => !v)} style={s.hoursCard} hitSlop={8}>
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
					<Text style={s.value} numberOfLines={1}>
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
	wrap: {
		paddingHorizontal: 16,
		paddingTop: 6,
		gap: 10,
	},

	row: {
		flexDirection: "row",
		gap: 10,
		alignItems: "flex-start",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.04)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},

	icon: {
		width: 34,
		height: 34,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.10)",
	},

	title: {
		fontSize: 12,
		fontWeight: "900",
		color: palette.textPrimary_1,
		opacity: 0.9,
	},
	value: {
		marginTop: 2,
		fontSize: 13,
		fontWeight: "800",
		color: palette.textMuted,
	},

	hoursCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.10)",
	},

	dayCard: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.04)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},
	dayTitle: {
		fontSize: 12,
		fontWeight: "900",
		color: palette.textPrimary_1,
	},
	dayValue: {
		marginTop: 2,
		fontSize: 12,
		fontWeight: "800",
		color: palette.textMuted,
	},
});

