import { palette } from "@/app/adapters/primary/react/css/colors";
import { PassAvatar } from "@/app/adapters/primary/react/features/pass/components/PassAvatar";
import type { PassRingViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { StyleSheet, Text, View } from "react-native";

interface ProfileHeroProps {
	avatarUrl?: string;
	displayName: string;
	rings?: PassRingViewModel[];
}

export function ProfileHero({ avatarUrl, displayName, rings = [] }: ProfileHeroProps) {
	const fallbackInitial = (displayName?.trim()?.[0] ?? "?").toUpperCase();

	return (
		<View style={styles.wrapper}>
			<PassAvatar
				imageUrl={avatarUrl}
				rings={rings}
				size={132}
				fallbackInitial={fallbackInitial}
				accessibilityLabel={`${displayName}, progression Pass actuelle`}
			/>

			<Text style={styles.name}>{displayName}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		alignItems: "center",
		gap: 8,
		paddingTop: 8,
		paddingBottom: 12,
	},
	name: {
		fontSize: 28,
		fontWeight: "600",
		color: palette.text_90,
	},
});
