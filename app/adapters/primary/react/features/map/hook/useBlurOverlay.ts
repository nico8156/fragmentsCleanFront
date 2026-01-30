import { useCallback, useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export function useBlurOverlay(isOpen: boolean) {
	const [shouldRender, setShouldRender] = useState(false);
	const opacity = useSharedValue(0);

	const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

	const hideFast = useCallback(() => {
		opacity.value = withTiming(0, { duration: 90 });
		setTimeout(() => setShouldRender(false), 110);
	}, []);

	useEffect(() => {
		if (isOpen) {
			setShouldRender(true);
			opacity.value = withTiming(1, { duration: 260 });
			return;
		}
		opacity.value = withTiming(0, { duration: 120 });
		const t = setTimeout(() => setShouldRender(false), 140);
		return () => clearTimeout(t);
	}, [isOpen]);

	return { shouldRender, style, hideFast };
}

