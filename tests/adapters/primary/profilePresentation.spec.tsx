import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileShortcuts } from "@/app/adapters/primary/react/features/profile/components/ProfileShortcuts";
import { FavoritesContent } from "@/app/adapters/primary/react/features/profile/components/FavoritesContent";
import { AccountActions } from "@/app/adapters/primary/react/features/profile/components/AccountActions";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { ProfileHeader } from "@/app/adapters/primary/react/features/profile/components/ProfileHeader";

jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-image", () => ({ Image: "NativeImage" }));
jest.mock("expo-symbols", () => ({ SymbolView: "NativeSymbol" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) }));
// Native rendering boundary only, no view-model or business-port mocks.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

describe("personal profile presentation", () => {
  let tree: any;
  const text = () => tree.root.findAllByType(Text).map((node: any) => node.props.children);
  const button = (label: string) => tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === label);
  afterEach(() => { if (tree) act(() => tree.unmount()); jest.restoreAllMocks(); });

  it("renders an accessible 44 point back control with an unrestricted title", () => {
    const onBack = jest.fn();
    act(() => { tree = create(<ProfileHeader title="Modifier mon profil" onBack={onBack} />); });
    const back = button("Retour");
    expect(StyleSheet.flatten(back.props.style({ pressed: false }))).toMatchObject({ width: 44, height: 44 });
    act(() => back.props.onPress()); expect(onBack).toHaveBeenCalledTimes(1);
    const title = tree.root.findAllByType(Text).find((node: any) => node.props.children === "Modifier mon profil");
    expect(title.props.numberOfLines).toBeUndefined();
    expect(title.props.allowFontScaling).not.toBe(false);
    expect(title.props.accessibilityRole).toBe("header");
    act(() => tree.update(<ProfileHeader title="Profil" />));
    expect(button("Retour")).toBeUndefined();
  });

  it.each([undefined, "", "   "])("provides a readable fallback without name or avatar (%s)", displayName => {
    act(() => { tree = create(<ProfileHero displayName={displayName} />); });
    expect(text()).toContain("Utilisateur"); expect(text()).toContain("U");
    expect(tree.root.findAllByType("NativeImage")).toHaveLength(0);
  });

  it("shows full identity, avatar, pending/error and delegates profile editing", () => {
    const onEdit = jest.fn();
    act(() => { tree = create(<ProfileHero displayName="Un prénom et un nom très longs" avatarUrl="file:///avatar.jpg" email="moi@example.test" syncing error="Profil à synchroniser" onEdit={onEdit} />); });
    expect(tree.root.findByType("NativeImage").props.source.uri).toBe("file:///avatar.jpg");
    expect(text()).toContain("moi@example.test");
    expect(text()).toContain("Profil en cours de synchronisation…");
    expect(tree.root.findAllByType(Text).find((node: any) => node.props.children === "Profil à synchroniser").props.accessibilityRole).toBe("alert");
    expect(tree.root.findAllByType(Text).find((node: any) => node.props.children === "Un prénom et un nom très longs").props.numberOfLines).toBeUndefined();
    act(() => button("Modifier mon profil").props.onPress()); expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("exposes the existing personal destinations with named touch targets", () => {
    const onNavigate = jest.fn();
    act(() => { tree = create(<ProfileShortcuts onNavigate={onNavigate} />); });
    for (const [label, route] of [["Mes expériences", "Experiences"], ["Cafés favoris", "Favorites"], ["Mes tickets", "Tickets"], ["Compte et réglages", "AppSettings"]]) {
      const control = button(label);
      expect(control.props.accessibilityRole).toBe("button");
      expect(StyleSheet.flatten(control.props.style({ pressed: false })).minHeight).toBeGreaterThanOrEqual(44);
      act(() => control.props.onPress()); expect(onNavigate).toHaveBeenLastCalledWith(route);
    }
  });

  it("shows saved places, pending and refresh errors together and opens the existing detail", () => {
    const name = "Bourbon d’Arsel — Torréfacteur et Coffee Shop";
    const refresh = jest.fn(), onOpenCoffee = jest.fn();
    act(() => { tree = create(<FavoritesContent vm={{ items: [{ coffeeId: "c", name, addressLine: "8 rue de la Monnaie", city: "Rennes", savedAt: "2026-10-05", version: 1, optimistic: true }], loading: "error", error: "offline", isEmpty: false, refresh }} onOpenCoffee={onOpenCoffee} />); });
    expect(text()).toContain("Mise à jour…");
    expect(text()).toContain("La mise à jour des favoris a échoué.");
    expect(tree.root.findAllByType(Text).find((node: any) => node.props.children === name).props.numberOfLines).toBeUndefined();
    act(() => button(`Ouvrir la fiche de ${name}`).props.onPress()); expect(onOpenCoffee).toHaveBeenCalledWith("c");
    act(() => button("Réessayer de charger les favoris").props.onPress()); expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("distinguishes empty favorites from an initial load", () => {
    const vm = { items: [], loading: "success" as const, error: undefined, isEmpty: true, refresh: jest.fn() };
    act(() => { tree = create(<FavoritesContent vm={vm} onOpenCoffee={jest.fn()} />); });
    expect(text()).toContain("Aucun favori");
    act(() => tree.update(<FavoritesContent vm={{ ...vm, loading: "pending" }} onOpenCoffee={jest.fn()} />));
    expect(text()).not.toContain("Aucun favori");
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  });

  it("keeps account callbacks and destructive confirmation unchanged", () => {
    const alert = jest.spyOn(Alert, "alert");
    const props = { isSignedIn: true, deleting: false, markHasNOTCompletedOnboarding: jest.fn(), signOut: jest.fn(), deleteAccount: jest.fn() };
    act(() => { tree = create(<AccountActions {...props} />); });
    act(() => button("Se déconnecter").props.onPress()); expect(props.signOut).toHaveBeenCalledTimes(1);
    act(() => button("Revoir l’onboarding").props.onPress()); expect(props.markHasNOTCompletedOnboarding).toHaveBeenCalledTimes(1);
    act(() => button("Supprimer mon compte").props.onPress()); expect(props.deleteAccount).not.toHaveBeenCalled();
    act(() => alert.mock.calls[0][2]!.find(action => action.style === "destructive")!.onPress!());
    expect(props.deleteAccount).toHaveBeenCalledTimes(1);
    act(() => tree.update(<AccountActions {...props} deleting accountDeletionError="Réessaie plus tard" />));
    expect(button("Supprimer mon compte").props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(text()).toContain("Réessaie plus tard");
    act(() => tree.update(<AccountActions {...props} isSignedIn={false} />));
    expect(button("Supprimer mon compte")).toBeUndefined();
  });

  it("keeps the profile viewport behind the glass and the last control scrollable above it", () => {
    const refresh = jest.fn();
    act(() => { tree = create(<ProfileLayout refreshing onRefresh={refresh}><Text>Dernière visite</Text></ProfileLayout>); });
    expect(StyleSheet.flatten(tree.root.findByProps({ testID: "scroll-clearance" }).props.style)).not.toHaveProperty("marginBottom");
    const scroll = tree.root.findByType(ScrollView);
    expect(StyleSheet.flatten(scroll.props.contentContainerStyle).paddingBottom).toBeGreaterThanOrEqual(142);
    expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(scroll.props.refreshControl.props.refreshing).toBe(true);
    act(() => scroll.props.refreshControl.props.onRefresh()); expect(refresh).toHaveBeenCalledTimes(1);
  });
});
