import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, Text } from "react-native";

export function HeartIcon({
	filled,
	size,
	color,
}: {
	filled: boolean;
	size: number;
	color: string;
}) {
	if (Platform.OS === "ios") {
		return <SymbolView name={filled ? "heart.fill" : "heart"} size={size} tintColor={color} />;
	}

	// Android (ou fallback) : toujours wrap dans Text
	return (
		<Text style={{ fontSize: size, color, fontWeight: "900", lineHeight: size }}>
			♥
		</Text>
	);
}
