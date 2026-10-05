import React from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, TextInput } from "react-native";
import { Provider } from "react-redux";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { coffeeRetrieved } from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";
import { parseToCoffeeId, parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { CoffeeListCard } from "@/app/adapters/primary/react/features/map/components/coffeeSelection/CoffeeListCard";
import { CoffeeDiscoveryControls } from "@/app/adapters/primary/react/features/map/components/CoffeeDiscoveryControls";
import ListViewForCoffees from "@/app/adapters/primary/react/features/map/screens/ListViewForCoffees";

const mockNavigate = jest.fn();
// Navigation and native rendering boundaries only; discovery hooks and Redux are real.
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-image", () => ({ Image: "NativeImage" }));
jest.mock("expo-symbols", () => ({ SymbolView: "NativeSymbol" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

describe("cafe discovery presentation", () => {
    let tree: any;
    const render = (element: React.ReactElement) => act(() => { tree = create(element); });
    const button = (label: string) => tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === label);
    const texts = () => tree.root.findAllByType(Text).map((node: any) => node.props.children).flat().join(" ");
    afterEach(() => { if (tree) act(() => tree.unmount()); mockNavigate.mockClear(); });

    it.each([true, false, undefined])("renders a long cafe name, a stable photo and open state %s", isOpen => {
        const onPress = jest.fn();
        const name = "Bourbon d’Arsel — Torréfacteur et Coffee Shop";
        render(<CoffeeListCard coffee={{ name, address: { line1: "8 rue de la Monnaie", city: "Rennes" }, photos: ["file:///coffee.jpg"] }} isOpen={isOpen} distanceText="200 m" onPress={onPress} />);
        const title = tree.root.findAllByType(Text).find((node: any) => node.props.children === name);
        expect(title.props.numberOfLines).toBe(2);
        expect(texts()).toContain(isOpen === undefined ? "Horaires à confirmer" : isOpen ? "Ouvert" : "Fermé");
        const photo = tree.root.findByType("NativeImage");
        expect(photo.props.cachePolicy).toBe("memory-disk");
        expect(StyleSheet.flatten(photo.props.style).aspectRatio).toBe(4 / 3);
        act(() => button(`Ouvrir la fiche de ${name}`).props.onPress()); expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("provides a quiet placeholder without a photo", () => {
        render(<CoffeeListCard coffee={{ name: "Café", address: {}, photos: [] }} onPress={jest.fn()} />);
        expect(tree.root.findAllByType("NativeImage")).toHaveLength(0);
        expect(tree.root.findAllByProps({ accessibilityLabel: "Photo indisponible" }).length).toBeGreaterThan(0);
    });

    it("uses readable tag copy without changing filter keys, toggles, search or sort callbacks", () => {
        const discovery = {
            coffees: [{ tags: ["google-places", "calme"] }],
            preferences: { query: "", onlyOpenNow: false, onlyWithPhotos: false, requiredTags: [] as string[], sort: "distance" as const },
            hasLocation: false, isUsingCachedCatalogue: true,
            setQuery: jest.fn(), setOnlyOpenNow: jest.fn(), setOnlyWithPhotos: jest.fn(), setRequiredTags: jest.fn(), setSort: jest.fn(),
        };
        render(<CoffeeDiscoveryControls discovery={discovery} />);
        expect(texts()).not.toContain("google-places"); expect(texts()).not.toContain("cache local");
        expect(texts()).toContain("cafés enregistrés affichés");
        act(() => button("Référencés sur Google").props.onPress());
        expect(discovery.setRequiredTags).toHaveBeenCalledWith(["google-places"]);
        act(() => tree.update(<CoffeeDiscoveryControls discovery={{ ...discovery, preferences: { ...discovery.preferences, requiredTags: ["google-places"] } }} />));
        expect(button("Référencés sur Google").props.accessibilityState.selected).toBe(true);
        act(() => button("Référencés sur Google").props.onPress()); expect(discovery.setRequiredTags).toHaveBeenLastCalledWith([]);
        act(() => button("Trier par pertinence").props.onPress()); expect(discovery.setSort).toHaveBeenCalledWith("relevance");
        act(() => tree.root.findByType(TextInput).props.onChangeText("Rennes")); expect(discovery.setQuery).toHaveBeenCalledWith("Rennes");
        for (const [label, callback] of [["Ouverts maintenant", discovery.setOnlyOpenNow], ["Avec photos", discovery.setOnlyWithPhotos]] as const) {
            act(() => tree.root.findAllByType(Switch).find((node: any) => node.props.accessibilityLabel === label).props.onValueChange(true));
            expect(callback).toHaveBeenCalledWith(true);
        }
        expect(StyleSheet.flatten(button("Trier par pertinence").props.style).minHeight).toBeGreaterThanOrEqual(44);
    });

    it("opens real selected cafes, searches, switches back to the map and reserves the floating bar", () => {
        const store = initReduxStoreWl({ dependencies: {} });
        for (const [id, name, city] of [["a", "Café Rennes", "Rennes"], ["b", "Café Paris", "Paris"]]) {
            store.dispatch(coffeeRetrieved({ id: parseToCoffeeId(id), name, address: { city }, location: { lat: 48, lon: -1 }, tags: [], version: 1, updatedAt: parseToISODate("2026-10-05T10:00:00Z") }));
        }
        const onMap = jest.fn();
        render(<Provider store={store}><ListViewForCoffees toggleViewMode={onMap} /></Provider>);
        expect(tree.root.findByType(FlatList).props.data).toHaveLength(2);
        act(() => button("Ouvrir la fiche de Café Rennes").props.onPress()); expect(mockNavigate).toHaveBeenCalledWith("CafeDetails", { id: "a" });
        const map = button("Afficher la carte");
        expect(StyleSheet.flatten(map.props.style({ pressed: false }))).toMatchObject({ width: 44, height: 44 });
        act(() => map.props.onPress()); expect(onMap).toHaveBeenCalledTimes(1);
        expect(StyleSheet.flatten(tree.root.findByProps({ testID: "scroll-clearance" }).props.style)).not.toHaveProperty("marginBottom");
        expect(StyleSheet.flatten(tree.root.findByType(FlatList).props.contentContainerStyle).paddingBottom).toBeGreaterThanOrEqual(142);
        act(() => tree.root.findByType(TextInput).props.onChangeText("Paris"));
        expect(tree.root.findByType(FlatList).props.data).toEqual(["b"]);
        act(() => tree.root.findByType(TextInput).props.onChangeText("Inconnu"));
        expect(texts()).toContain("Aucun café trouvé");
        expect(button("Afficher la carte")).toBeDefined();
    });
});
