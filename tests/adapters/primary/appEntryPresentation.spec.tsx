import React from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import Onboarding from "@/app/adapters/primary/react/features/onboarding/components/Onboarding";
import { GoogleSignInButton } from "@/app/adapters/primary/react/features/auth/components/GoogleSignInButton";
import { palette } from "@/app/adapters/primary/react/css/colors";

jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "NativeSafeAreaView" }));
// Native rendering boundaries only; no auth/view-model mocks.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

describe("minimal app entry", () => {
    let tree: any;
    afterEach(() => { if (tree) act(() => tree.unmount()); });

    it("offers one accessible continuation that delegates to the existing completion callback", () => {
        const onFinish = jest.fn();
        act(() => { tree = create(<Onboarding onFinish={onFinish} />); });
        const texts = tree.root.findAllByType(Text).map((node: any) => node.props.children);
        expect(texts).toEqual(["Fragments", "Ton carnet de cafés.", "Continuer"]);
        const buttons = tree.root.findAllByType(Pressable);
        expect(buttons).toHaveLength(1);
        expect(buttons[0].props.accessibilityLabel).toBe("Continuer");
        expect(StyleSheet.flatten(buttons[0].props.style({ pressed: false })).minHeight).toBeGreaterThanOrEqual(44);
        act(() => buttons[0].props.onPress()); expect(onFinish).toHaveBeenCalledTimes(1);
        expect(tree.root.findAllByType(ScrollView)).toHaveLength(1);
        expect(StyleSheet.flatten(tree.root.findByType("NativeSafeAreaView").props.style).backgroundColor).toBe(palette.background);
    });

    it("keeps the original Google action on a light accessible button with an untinted local logo", () => {
        const onPress = jest.fn();
        act(() => { tree = create(<GoogleSignInButton onPress={onPress} loading={false} />); });
        const button = tree.root.findByType(Pressable);
        expect(button.props.accessibilityRole).toBe("button");
        expect(button.props.accessibilityLabel).toBe("Continuer avec Google");
        const style = StyleSheet.flatten(button.props.style({ pressed: false }));
        expect(style.backgroundColor).toBe("#FFFFFF");
        expect(style.minHeight).toBeGreaterThanOrEqual(44);
        const logo = tree.root.findByType(Image);
        expect(logo.props.source).toEqual(require("@/assets/images/google-g.png"));
        expect(logo.props.resizeMode).toBe("contain");
        expect(StyleSheet.flatten(logo.props.style).tintColor).toBeUndefined();
        act(() => button.props.onPress()); expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("keeps the Google action named and disabled while authentication is pending", () => {
        act(() => { tree = create(<GoogleSignInButton onPress={jest.fn()} loading />); });
        const button = tree.root.findByType(Pressable);
        expect(button.props.disabled).toBe(true);
        expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
        expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
        expect(tree.root.findByType(Text).props.children).toBe("Continuer avec Google");
    });
});
