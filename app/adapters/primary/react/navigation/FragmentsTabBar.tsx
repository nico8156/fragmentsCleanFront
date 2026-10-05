import { tabBarGeometry } from "@/app/adapters/primary/react/css/designTokens";
import { floatingTabGlassPresentation, floatingTabPresentation } from "@/app/adapters/primary/react/navigation/floatingTabBar";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { AccessibilityInfo, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { type ComponentProps, useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FragmentsTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
	const insets = useSafeAreaInsets();
	const [keyboardVisible, setKeyboardVisible] = useState(false);
	const [reduceTransparency, setReduceTransparency] = useState(false);

	useEffect(() => {
		const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
		const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
		return () => { show.remove(); hide.remove(); };
	}, []);

	useEffect(() => {
		let active = true;
		AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => { if (active) setReduceTransparency(enabled); });
		const subscription = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setReduceTransparency);
		return () => { active = false; subscription.remove(); };
	}, []);

	if (keyboardVisible) return null;

	return (
		<View style={[styles.shell, { bottom: Math.max(insets.bottom, tabBarGeometry.minimumInset) + tabBarGeometry.bottomGap }]}>
			{reduceTransparency ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.opaque]} /> : <BlurView pointerEvents="none" intensity={floatingTabGlassPresentation.blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />}
			<View pointerEvents="none" style={styles.glassTint} />
			<View pointerEvents="none" style={styles.glassHighlight} />
			<View style={styles.row} accessibilityRole="tablist">
				{state.routes.map((route, index) => {
					const selected = state.index === index;
					const options = descriptors[route.key]?.options;
					const presentation = floatingTabPresentation[route.name as keyof typeof floatingTabPresentation];
					const label = options?.tabBarAccessibilityLabel ?? presentation.label;
					return <FragmentsTabItem
						key={route.key}
						label={String(label)}
						icon={presentation.icon}
						selected={selected}
						onPress={() => {
							const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
							if (!selected && !event.defaultPrevented) {
								Haptics.selectionAsync().catch(() => undefined);
								navigation.navigate(route.name, route.params);
							}
						}}
						onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
					/>;
				})}
			</View>
		</View>
	);
}

function FragmentsTabItem({ label, icon, selected, onPress, onLongPress }: {
	label: string;
	icon: ComponentProps<typeof Ionicons>["name"];
	selected: boolean;
	onPress: () => void;
	onLongPress: () => void;
}) {
	const progress = useSharedValue(selected ? 1 : 0);
	useEffect(() => { progress.value = withTiming(selected ? 1 : 0, { duration: 170 }); }, [progress, selected]);
	const indicatorStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scaleX: 0.7 + progress.value * 0.3 }] }));
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			accessibilityRole="tab"
			accessibilityState={{ selected }}
			accessibilityLabel={label}
			style={({ pressed }) => [styles.item, pressed && styles.pressed]}
		>
			<View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
				<Ionicons name={icon} size={19} color={selected ? palette.textPrimary : palette.textSecondary} />
			</View>
			<Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
			<Animated.View style={[styles.indicator, indicatorStyle]} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	shell: { position: "absolute", left: 16, right: 16, height: tabBarGeometry.height, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: floatingTabGlassPresentation.borderColor, shadowColor: palette.accent, shadowOpacity: 0.2, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 13 },
	opaque: { backgroundColor: palette.surface },
	glassTint: { ...StyleSheet.absoluteFillObject, backgroundColor: floatingTabGlassPresentation.surfaceColor },
	glassHighlight: { position: "absolute", top: 0, left: 22, right: 22, height: 1, borderRadius: 99, backgroundColor: floatingTabGlassPresentation.highlightColor },
	row: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
	item: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 18 },
	pressed: { opacity: 0.74 },
	iconWrap: { width: 30, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 12 },
	iconWrapSelected: { backgroundColor: "rgba(200,106,58,0.28)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(244,237,230,0.26)" },
	label: { color: palette.textSecondary, fontSize: 11, fontWeight: "700" },
	labelSelected: { color: palette.textPrimary, fontWeight: "900" },
	indicator: { width: 18, height: 3, borderRadius: 99, backgroundColor: palette.accent, marginTop: 1 },
});
