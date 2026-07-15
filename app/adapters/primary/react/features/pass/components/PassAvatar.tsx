import { palette } from "@/app/adapters/primary/react/css/colors";
import type { PassRingViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type PassAvatarProps = {
	imageUrl?: string;
	rings: PassRingViewModel[];
	size: number;
	accessibilityLabel?: string;
	fallbackInitial?: string;
};

export function PassAvatar({ imageUrl, rings, size, accessibilityLabel, fallbackInitial = "F" }: PassAvatarProps) {
	const ringGap = Math.max(4, Math.round(size * 0.045));
	const strokeWidth = Math.max(2, Math.round(size * 0.032));
	const outerPadding = rings.length * (strokeWidth + ringGap) + strokeWidth;
	const canvasSize = size + outerPadding * 2;
	const center = canvasSize / 2;
	const avatarRadius = size / 2;
	const initialsSize = Math.max(18, Math.round(size * 0.34));

	return (
		<View
			style={[styles.root, { width: canvasSize, height: canvasSize }]}
			accessibilityRole="image"
			accessibilityLabel={accessibilityLabel}
		>
			<Svg width={canvasSize} height={canvasSize} style={StyleSheet.absoluteFill}>
				{rings.map((ring, index) => {
					const radius = avatarRadius + ringGap + strokeWidth / 2 + index * (strokeWidth + ringGap);
					const circumference = 2 * Math.PI * radius;
					const progress = ring.status === "completed" ? 1 : ring.progress;
					const activeColor = ring.status === "completed" ? ring.completedColor : ring.progressColor;
					return (
						<React.Fragment key={ring.level}>
							<Circle
								cx={center}
								cy={center}
								r={radius}
								stroke={ring.trackColor}
								strokeWidth={strokeWidth}
								fill="transparent"
							/>
							{progress > 0 ? (
								<Circle
									cx={center}
									cy={center}
									r={radius}
									stroke={activeColor}
									strokeWidth={strokeWidth}
									fill="transparent"
									strokeLinecap="round"
									strokeDasharray={`${circumference} ${circumference}`}
									strokeDashoffset={circumference * (1 - progress)}
									transform={`rotate(-90 ${center} ${center})`}
								/>
							) : null}
						</React.Fragment>
					);
				})}
			</Svg>

			<View
				style={[
					styles.avatar,
					{
						width: size,
						height: size,
						borderRadius: size / 2,
						left: outerPadding,
						top: outerPadding,
					},
				]}
			>
				{imageUrl ? (
					<Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
				) : (
					<Text style={[styles.fallback, { fontSize: initialsSize }]}>{fallbackInitial}</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		alignItems: "center",
		justifyContent: "center",
	},
	avatar: {
		position: "absolute",
		overflow: "hidden",
		backgroundColor: palette.elevated,
		borderWidth: 1,
		borderColor: palette.border_70,
		alignItems: "center",
		justifyContent: "center",
	},
	fallback: {
		color: palette.textPrimary,
		fontWeight: "800",
	},
});
