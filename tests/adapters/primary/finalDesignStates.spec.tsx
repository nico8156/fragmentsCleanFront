import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { DetailsError, DetailsSkeleton } from "@/app/adapters/primary/react/features/cafes/components/DetailsStates";
import { MyExperiencesReadState } from "@/app/adapters/primary/react/features/experiences/components/MyExperiencesReadState";

jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-symbols", () => ({ SymbolView: "NativeSymbol" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) }));
// Native rendering boundaries only; no view-model or business-port mocks.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

describe("final design secondary states", () => {
    let tree: any;
    const texts = () => tree.root.findAllByType(Text).map((node: any) => node.props.children);
    afterEach(() => { if (tree) act(() => tree.unmount()); });

    it.each([DetailsSkeleton, DetailsError])("keeps cafe detail secondary states scrollable with a 44pt back control (%p)", Component => {
        const onBack = jest.fn();
        act(() => { tree = create(<Component onBack={onBack} />); });
        const back = tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === "Retour");
        expect(StyleSheet.flatten(back.props.style({ pressed: false }))).toMatchObject({ width: 44, height: 44 });
        act(() => back.props.onPress()); expect(onBack).toHaveBeenCalledTimes(1);
        expect(tree.root.findAllByType(ScrollView)).toHaveLength(1);
        expect(StyleSheet.flatten(tree.root.findByProps({ testID: "scroll-clearance" }).props.style).marginBottom).toBe(34);
        expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(Component === DetailsSkeleton ? 1 : 0);
        if (Component === DetailsError) expect(texts()).toContain("Café introuvable");
    });

    it("distinguishes initial loading from a successful empty list", () => {
        const props = { loading: true, hasItems: false, onRetry: jest.fn() };
        act(() => { tree = create(<MyExperiencesReadState {...props} />); });
        expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
        expect(texts()).not.toContain("Aucune expérience pour le moment");
        act(() => tree.update(<MyExperiencesReadState {...props} loading={false} />));
        expect(texts()).toContain("Aucune expérience pour le moment");
        expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(0);
    });

    it.each([false, true])("keeps a retry and describes saved content only when present (%s)", hasItems => {
        const onRetry = jest.fn();
        act(() => { tree = create(<MyExperiencesReadState loading={false} hasItems={hasItems} error="network" onRetry={onRetry} />); });
        expect(texts()).toContain(hasItems ? "Données enregistrées affichées." : "Impossible de charger tes expériences.");
        expect(texts()).not.toContain("Aucune expérience pour le moment");
        const retry = tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === "Réessayer");
        expect(StyleSheet.flatten(retry.props.style({ pressed: false })).minHeight).toBeGreaterThanOrEqual(44);
        act(() => retry.props.onPress()); expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("does not replace saved experiences with a full loading state during refresh", () => {
        act(() => { tree = create(<MyExperiencesReadState loading hasItems onRetry={jest.fn()} />); });
        expect(tree.toJSON()).toBeNull();
    });
});
