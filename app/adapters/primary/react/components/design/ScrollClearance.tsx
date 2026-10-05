import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabBarClearance } from "../../css/designTokens";

export function useBottomClearance(floatingTab = true) {
    const { bottom } = useSafeAreaInsets();
    return floatingTab ? tabBarClearance(bottom) : bottom;
}

type Props =
    | { floatingTab?: true; children: (bottom: number) => ReactNode }
    | { floatingTab: false; children: ReactNode };

// Tab routes keep the full viewport behind the glass. The caller adds this
// clearance to scroll content padding, so the last control can scroll above it.
// Root-stack routes without tabs retain their safe-area-only viewport inset.
export function ScrollClearance(props: Props) {
    const bottom = useBottomClearance(props.floatingTab !== false);
    return <View testID="scroll-clearance" style={[styles.viewport,
        props.floatingTab === false && { marginBottom: bottom }]}>
        {props.floatingTab === false ? props.children : props.children(bottom)}
    </View>;
}

const styles = StyleSheet.create({
    viewport: { flex: 1, overflow: "hidden" },
});
