import { View, StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingIconButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { spacing, tabBarClearance } from "@/app/adapters/primary/react/css/designTokens";

type Props = { size: number; name: SFSymbols6_0; color: string; localizeMe: () => void; isFollowing?: boolean };

export default function LocalisationButton({ size, name, color, localizeMe, isFollowing }: Props) {
	const insets = useSafeAreaInsets();
	return (
		<View style={[styles.container, { bottom: tabBarClearance(insets.bottom) }]}>
			<FloatingIconButton onPress={localizeMe} selected={Boolean(isFollowing)}
				accessibilityLabel={isFollowing ? "Recentrer sur ma position, suivi actif" : "Recentrer sur ma position"}>
				<SymbolView name={name} size={size} tintColor={color} />
			</FloatingIconButton>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { position: "absolute", right: spacing.section },
});
