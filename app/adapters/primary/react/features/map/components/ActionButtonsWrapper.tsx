import { View, StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing } from "@/app/adapters/primary/react/css/designTokens";
import { FloatingIconButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActionButtonsWrapper({ toggleViewMode }: { toggleViewMode: () => void }) {
	const navigation = useNavigation<RootStackNavigationProp>();
	const insets = useSafeAreaInsets();
	return (
		<View pointerEvents="box-none" style={[styles.container, { top: insets.top + spacing.micro }]}>
			<FloatingIconButton onPress={toggleViewMode} accessibilityLabel="Afficher la liste des cafés">
				<SymbolView name="list.bullet.rectangle" size={22} tintColor={palette.textPrimary} />
			</FloatingIconButton>
			<FloatingIconButton onPress={() => navigation.navigate("ScanTicketModal")} accessibilityLabel="Scanner un ticket">
				<SymbolView name="barcode.viewfinder" size={22} tintColor={palette.textPrimary} />
			</FloatingIconButton>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { position: "absolute", width: "100%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.section },
});
