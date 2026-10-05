import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SFSymbols6_0 } from "sf-symbols-typescript";

import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import { palette } from "@/app/adapters/primary/react/css/colors";

export interface ProfileMenuItem<TDestination extends string = string> {
	symbolName: SFSymbols6_0;
	title: string;
	destination: TDestination;
}

interface ProfileMenuListProps<TDestination extends string> {
	items: ProfileMenuItem<TDestination>[];
	onNavigate: (destination: TDestination) => void;
}

export function ProfileMenuList<TDestination extends string>({
	items,
	onNavigate,
}: ProfileMenuListProps<TDestination>) {
	return (
		<View style={styles.card}>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;

				return (
					<Pressable
						key={item.destination}
						accessibilityRole="button"
						accessibilityLabel={item.title}
						onPress={() => onNavigate(item.destination)}
						style={({ pressed }) => [styles.row, pressed && styles.pressed]}
						android_ripple={{ color: palette.bg_dark_10 }}
					>
						<View style={styles.left}>
							<SymbolView
								name={item.symbolName}
								size={22}
								weight="semibold"
								tintColor={palette.textPrimary}
							/>
							<Text style={styles.label}>{item.title}</Text>
						</View>

						<SymbolView name="chevron.forward" tintColor={palette.textPrimary} />

						{!isLast && <View style={styles.divider} />}
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 0 },
	row: { minHeight: 56, paddingVertical: spacing.compact, flexDirection: "row", alignItems: "center", gap: spacing.compact },
	pressed: { opacity: 0.7 },
	left: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.compact },
	label: { ...typography.card, color: palette.textPrimary, flex: 1 },
	divider: { position: "absolute", left: 34, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: palette.border, opacity: 0.6 },
});
