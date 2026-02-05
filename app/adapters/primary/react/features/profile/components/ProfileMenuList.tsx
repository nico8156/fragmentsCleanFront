import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SFSymbols6_0 } from "sf-symbols-typescript";

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

						<SymbolView
							name="chevron.forward"
							tintColor={palette.textPrimary}
						/>

						{!isLast && <View style={styles.divider} />}
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: palette.bg_dark_30,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: palette.border,
		overflow: "hidden",
	},
	row: {
		paddingHorizontal: 18,
		paddingVertical: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	pressed: {
		opacity: 0.7,
	},
	left: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	label: {
		fontSize: 17,
		fontWeight: "600",
		color: palette.text_90,
	},
	divider: {
		position: "absolute",
		left: 54,
		right: 0,
		bottom: 0,
		height: 1,
		backgroundColor: palette.border,
		opacity: 0.6,
	},
});

