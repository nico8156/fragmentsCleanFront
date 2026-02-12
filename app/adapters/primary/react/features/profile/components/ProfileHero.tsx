import { palette } from "@/app/adapters/primary/react/css/colors";
import { Image, StyleSheet, Text, View } from "react-native";

interface ProfileHeroProps {
	avatarUrl?: string;
	displayName: string;
}

export function ProfileHero({ avatarUrl, displayName }: ProfileHeroProps) {
	const hasAvatar = typeof avatarUrl === "string" && avatarUrl.length > 0;

	return (
		<View style={styles.wrapper}>
			{hasAvatar ? (
				<Image source={{ uri: avatarUrl }} style={styles.avatar} />
			) : (
				<View style={[styles.avatar, styles.avatarPlaceholder]}>
					<Text style={styles.avatarInitial}>
						{(displayName?.trim()?.[0] ?? "?").toUpperCase()}
					</Text>
				</View>
			)}

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
	avatar: {
		width: 140,
		height: 140,
		borderRadius: 70,
	},
	avatarPlaceholder: {
		backgroundColor: palette.bg_dark_30,
		borderWidth: 1,
		borderColor: palette.border,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarInitial: {
		fontSize: 44,
		fontWeight: "700",
		color: palette.textPrimary,
	},
	name: {
		fontSize: 28,
		fontWeight: "600",
		color: palette.text_90,
	},
});

