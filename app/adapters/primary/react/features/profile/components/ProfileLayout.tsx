import { palette } from "@/app/adapters/primary/react/css/colors";
import { FLOATING_TAB_BAR_CLEARANCE } from "@/app/adapters/primary/react/navigation/floatingTabBar";
import { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";

interface ProfileLayoutProps {
	children: ReactNode;
	refreshing?: boolean;
	onRefresh?: () => void;
}

export function ProfileLayout({ children, refreshing, onRefresh }: ProfileLayoutProps) {
	return (
		<ScrollView
			automaticallyAdjustKeyboardInsets
			keyboardShouldPersistTaps="handled"
			keyboardDismissMode="interactive"
			style={styles.root}
			contentContainerStyle={styles.content}
			refreshControl={onRefresh ? (
				<RefreshControl
					refreshing={Boolean(refreshing)}
					onRefresh={onRefresh}
					tintColor={palette.textPrimary}
				/>
			) : undefined}
		>
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
		paddingTop: 16,
		paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
		gap: 16,
	},
});
