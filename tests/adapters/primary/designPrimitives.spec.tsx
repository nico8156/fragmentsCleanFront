import React from "react";
import { ActivityIndicator, ScrollView, Pressable, StyleSheet, Text } from "react-native";
import { ContentState, FloatingIconButton, FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { surfaces, tabBarClearance } from "@/app/adapters/primary/react/css/designTokens";
import BottomSheetPreviewSimple from "@/app/adapters/primary/react/features/map/components/BottomSheetPreviewSimple";
import MapCoffeePreviewSheet from "@/app/adapters/primary/react/features/map/components/MapCoffeePreviewSheet";

// Native press target: inspect supplied availability and callbacks without simulating UIKit.
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("@gorhom/bottom-sheet", () => ({ __esModule: true, default: "NativeBottomSheet", BottomSheetScrollView: "NativeSheetScrollView", BottomSheetFooter: "NativeSheetFooter" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) }));
// Renderer and sheet hosts represent the native UI boundary, not business ports.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

function luminance(hex: string) {
	const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
		.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
	return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
	const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Fragments presentation primitives", () => {
	let tree: any;
	afterEach(() => { if (tree) act(() => tree.unmount()); });

	it("exposes the floating icon's name, selected state and action to the native control", () => {
		const onPress = jest.fn();
		act(() => { tree = create(<FloatingIconButton accessibilityLabel="Recentrer sur ma position, suivi actif" selected onPress={onPress}><Text>Icône</Text></FloatingIconButton>); });
		const button = tree.root.findByType(Pressable);
		expect(button.props.accessibilityLabel).toBe("Recentrer sur ma position, suivi actif");
		expect(button.props.accessibilityRole).toBe("button");
		expect(button.props.accessibilityState).toEqual({ selected: true });
		act(() => button.props.onPress());
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it.each(["primary", "secondary", "tertiary", "danger"] as const)("keeps the %s action accessible and disabled when unavailable", variant => {
		const onPress = jest.fn();
		act(() => { tree = create(<FragmentsButton label="Action" variant={variant} onPress={onPress} disabled />); });
		let button = tree.root.findByType(Pressable);
		expect(button.props.disabled).toBe(true);
		expect(button.props.accessibilityState).toEqual({ disabled: true });
		expect(button.props.accessibilityRole).toBe("button");
		expect(button.props.accessibilityLabel).toBe("Action");
		act(() => tree.update(<FragmentsButton label="Action" variant={variant} onPress={onPress} />));
		button = tree.root.findByType(Pressable);
		act(() => button.props.onPress());
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it.each(["empty", "loading", "error", "offline", "stale"] as const)("renders %s feedback and delegates its optional action", kind => {
		const onAction = jest.fn();
		act(() => { tree = create(<ContentState kind={kind} message="Contenu enregistré" action="Voir la carte" onAction={onAction} />); });
		expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(kind === "loading" ? 1 : 0);
		expect(tree.root.findAllByType(Text).some((node: any) => node.props.children === "Contenu enregistré")).toBe(true);
		act(() => tree.root.findByType(Pressable).props.onPress());
		expect(onAction).toHaveBeenCalledTimes(1);
	});

	it("keeps enabled button labels and light-sheet metadata readable", () => {
		for (const [foreground, background] of [
			[palette.background, palette.accent],
			[surfaces.previewText, surfaces.previewTonal],
			[surfaces.previewSecondary, surfaces.preview],
			[palette.accentMuted, surfaces.preview],
			[surfaces.previewDanger, surfaces.preview],
			[palette.accent, surfaces.canvas],
			[palette.textSecondary, surfaces.card],
		]) expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
	});

	it("reserves the bar, safe area, bottom gap and a readable margin", () => {
		expect(tabBarClearance(34)).toBeGreaterThanOrEqual(70 + 34 + 10 + 12);
		expect(tabBarClearance(48)).toBeGreaterThanOrEqual(70 + 48 + 10 + 12);
		expect(tabBarClearance(0)).toBeGreaterThanOrEqual(70 + 10 + 10 + 12);
	});

	it("lets content scroll behind the glass and clears the last action at the end", () => {
        act(() => { tree = create(<ScrollClearance>{bottom => <ScrollView contentContainerStyle={{ paddingBottom: bottom + 16 }}><Text>Last article</Text></ScrollView>}</ScrollClearance>); });
        const style = StyleSheet.flatten(tree.root.findByProps({ testID: "scroll-clearance" }).props.style);
        expect(style.marginBottom).toBeUndefined();
        expect(style.backgroundColor).toBeUndefined();
        expect(style.flex).toBe(1);
        const padding = StyleSheet.flatten(tree.root.findByType(ScrollView).props.contentContainerStyle).paddingBottom;
        // At maximum offset, the last item ends 142pt above the viewport bottom;
        // the bar top is 114pt above it (70pt height + 34pt inset + 10pt gap).
        expect(padding - (70 + 34 + 10)).toBeGreaterThanOrEqual(12);
    });

    it("keeps only the safe area on routes without tabs", () => {
        act(() => { tree = create(<ScrollClearance floatingTab={false}><Text>Details</Text></ScrollClearance>); });
        expect(StyleSheet.flatten(tree.root.findByProps({ testID: "scroll-clearance" }).props.style).marginBottom).toBe(34);
    });

	it("keeps both preview actions unavailable while loading, then delegates independently", () => {
		const onPressDetails = jest.fn();
		const onPressDirections = jest.fn();
		const props = { name: "Bourbon d’Arsel — Torréfacteur et Coffee Shop", canOpenDirections: true, onPressDetails, onPressDirections };
		act(() => { tree = create(<BottomSheetPreviewSimple {...props} isLoading />); });
		expect(tree.root.findAllByType(Pressable)).toHaveLength(2);
		expect(tree.root.findAllByType(Pressable).every((node: any) => node.props.disabled)).toBe(true);
		act(() => tree.update(<BottomSheetPreviewSimple {...props} />));
		const [details, directions] = tree.root.findAllByType(Pressable);
		expect(details.props.disabled).toBe(false);
		expect(directions.props.disabled).toBe(false);
		act(() => details.props.onPress());
		expect(onPressDetails).toHaveBeenCalledTimes(1);
		expect(onPressDirections).not.toHaveBeenCalled();
		act(() => directions.props.onPress());
		expect(onPressDirections).toHaveBeenCalledTimes(1);
		const title = tree.root.findAllByType(Text).find((node: any) => node.props.children === props.name);
		expect(title.props.numberOfLines).toBeUndefined();
		act(() => tree.update(<BottomSheetPreviewSimple {...props} canOpenDirections={false} />));
		expect(tree.root.findAllByType(Pressable)[1].props.disabled).toBe(true);
	});

	it("keeps an empty selection unavailable without fabricating a coffee", () => {
		act(() => { tree = create(<BottomSheetPreviewSimple canOpenDirections={false} onPressDetails={jest.fn()} onPressDirections={jest.fn()} />); });
		expect(tree.root.findAllByType(Pressable)).toHaveLength(2);
		expect(tree.root.findAllByType(Pressable).every((node: any) => node.props.disabled)).toBe(true);
	});

	it("provides a scrollable preview with bottom clearance for large text", () => {
		act(() => { tree = create(<MapCoffeePreviewSheet bottomSheetRef={{ current: null }} index={0} onChange={jest.fn()}
			snapPoints={["58%"]} name="Café" canOpenDirections onPressDetails={jest.fn()} onPressDirections={jest.fn()} />); });
		const scroll = tree.root.findByType("NativeSheetScrollView");
		expect(StyleSheet.flatten(scroll.props.contentContainerStyle).paddingBottom).toBeGreaterThanOrEqual(126);
		const sheet = tree.root.findByType("NativeBottomSheet");
		expect(sheet.props.enablePanDownToClose).toBe(true);
		expect(sheet.props.snapPoints).toEqual(["58%"]);
		expect(sheet.props.footerComponent).toBeUndefined();
	});
});
