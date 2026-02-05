import { palette } from "@/app/adapters/primary/react/css/colors";
import { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";

interface ProfileLayoutProps {
	children: ReactNode;
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
	return (
		<ScrollView style={styles.root} contentContainerStyle={styles.content}>
			{children}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: palette.bg_dark_90,
	},
	content: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 16,
	},
});

