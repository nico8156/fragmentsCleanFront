import { palette } from "@/app/adapters/primary/react/css/colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
	title: string;
	description: string;
	progressLabel?: string;
	ctaLabel: string;
	onPressCta: () => void;
	onPressCard?: () => void;
};

export function NextGoalCard({
	title,
	description,
	progressLabel,
	ctaLabel,
	onPressCta,
	onPressCard,
}: Props) {
	return (
		<TouchableOpacity
			activeOpacity={onPressCard ? 0.9 : 1}
			onPress={onPressCard}
			style={styles.card}
		>
			<View style={styles.topRow}>
				<View style={{ flex: 1, gap: 6 }}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.desc}>{description}</Text>
					{!!progressLabel && <Text style={styles.progressLabel}>{progressLabel}</Text>}
				</View>
			</View>

			<TouchableOpacity onPress={onPressCta} activeOpacity={0.9} style={styles.ctaBtn}>
				<Text style={styles.ctaText}>{ctaLabel}</Text>
			</TouchableOpacity>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: palette.elevated,
		borderRadius: 20,
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.border,
		gap: 12,
	},
	topRow: { flexDirection: "row", alignItems: "flex-start" },
	title: { fontSize: 15, fontWeight: "900", color: palette.textPrimary },
	desc: { fontSize: 13, lineHeight: 18, color: palette.textSecondary },
	progressLabel: { fontSize: 12, fontWeight: "700", color: palette.textMuted },

	ctaBtn: {
		borderRadius: 14,
		paddingVertical: 10,
		alignItems: "center",
		backgroundColor: palette.accent,
	},
	ctaText: { color: palette.background, fontWeight: "900", fontSize: 13 },
});

