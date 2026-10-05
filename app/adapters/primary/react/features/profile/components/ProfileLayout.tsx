import { palette } from "@/app/adapters/primary/react/css/colors";
import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import { spacing, scrollContentSpacing, surfaces } from "@/app/adapters/primary/react/css/designTokens";
import { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

interface ProfileLayoutProps {
	children: ReactNode;
	refreshing?: boolean;
	paddingTop?: number;
	onRefresh?: () => void;
}

export function ProfileLayout({ children, refreshing, onRefresh, paddingTop = 16 }: ProfileLayoutProps) {
	return (
		<View style={styles.root}>
			<ScrollClearance>{bottom => (
				<ScrollView
					automaticallyAdjustKeyboardInsets
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="interactive"
					style={styles.root}
					contentContainerStyle={[styles.content, { paddingTop, paddingBottom: scrollContentSpacing.paddingBottom + bottom }]}
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
			)}</ScrollClearance>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: surfaces.canvas,
	},
	content: {
		paddingHorizontal: spacing.standard,
		paddingTop: 16,
		...scrollContentSpacing,
		gap: 16,
	},
});
