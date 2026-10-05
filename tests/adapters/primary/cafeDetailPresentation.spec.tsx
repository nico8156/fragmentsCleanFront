import React, { useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, Share, StyleSheet, Text, TextInput } from "react-native";
import { CafeDetailsHeader } from "@/app/adapters/primary/react/features/cafes/components/CafeDetailsHeader";
import { ContributionDisclosure } from "@/app/adapters/primary/react/features/cafes/components/ContributionDisclosure";
import { DetailsActionsRow } from "@/app/adapters/primary/react/features/cafes/components/DetailsActionsRow";
import { PhotosSection } from "@/app/adapters/primary/react/features/cafes/components/PhotosSection";
import { InfoSection } from "@/app/adapters/primary/react/features/cafes/components/InfoSection";

// Only native rendering/platform APIs are mocked. No business view model or port mock.
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-symbols", () => ({ SymbolView: "NativeSymbol" }));
jest.mock("expo-image", () => ({ Image: "NativeCachedImage" }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

function Draft() {
  const [value, setValue] = useState("");
  return <TextInput value={value} onChangeText={setValue} />;
}

describe("Coffee detail presentation", () => {
  let tree: any;
  afterEach(() => { if (tree) act(() => tree.unmount()); jest.restoreAllMocks(); });

  it("folds contribution without losing the draft or exposing hidden controls to accessibility", () => {
    act(() => { tree = create(<ContributionDisclosure><Draft /></ContributionDisclosure>); });
    const content = () => tree.root.findByProps({ testID: "experience-composer-content" });
    const toggle = () => tree.root.findByType(Pressable);
    expect(toggle().props.accessibilityState.expanded).toBe(false);
    expect(StyleSheet.flatten(content().props.style).display).toBe("none");
    expect(content().props.importantForAccessibility).toBe("no-hide-descendants");
    act(() => toggle().props.onPress());
    expect(toggle().props.accessibilityState.expanded).toBe(true);
    expect(content().props.accessibilityElementsHidden).toBe(false);
    act(() => tree.root.findByType(TextInput).props.onChangeText("Très bon espresso"));
    act(() => toggle().props.onPress());
    act(() => toggle().props.onPress());
    expect(tree.root.findByType(TextInput).props.value).toBe("Très bon espresso");
  });

  it.each(["pending", "acked", "failed"] as const)("keeps the full title, actions and %s synchronization feedback", state => {
    const onBack = jest.fn(), onPressLike = jest.fn(), onPressComments = jest.fn();
    const title = "Bourbon d’Arsel — Torréfacteur et Coffee Shop";
    act(() => { tree = create(<CafeDetailsHeader title={title} statusLabel="FERMÉ" likeCount={3} likedByMe
      likeSync={{ state, untilMs: 1 }} commentCount={2} commentSync={null}
      onBack={onBack} onPressLike={onPressLike} onPressComments={onPressComments} />); });
    const titleNode = tree.root.findAllByType(Text).find((node: any) => node.props.children === title);
    expect(titleNode.props.numberOfLines).toBeUndefined();
    const buttons = tree.root.findAllByType(Pressable);
    expect(buttons).toHaveLength(3);
    const like = buttons.find((node: any) => node.props.accessibilityLabel.startsWith("Retirer"));
    expect(like.props.accessibilityState).toMatchObject({ selected: true, busy: state === "pending" });
    expect(like.props.accessibilityValue.text).toBe({ pending: "Envoi…", acked: "Envoyé", failed: "Échec" }[state]);
    act(() => buttons.forEach((node: any) => node.props.onPress()));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onPressLike).toHaveBeenCalledTimes(1);
    expect(onPressComments).toHaveBeenCalledTimes(1);
  });

  it("preserves unavailable call and pending favorite state, then delegates saving", () => {
    const onToggle = jest.fn();
    act(() => { tree = create(<DetailsActionsRow coffee={{ name: "Café" }} addressLine="Rennes" saved={{ saved: true, pending: true, onToggle }} />); });
    const button = (label: string) => tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === label);
    expect(button("Appeler").props.disabled).toBe(true);
    expect(button("Mise à jour du favori en cours").props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    act(() => tree.update(<DetailsActionsRow coffee={{ name: "Café" }} addressLine="Rennes" saved={{ saved: true, onToggle }} />));
    act(() => button("Retirer ce café des favoris").props.onPress());
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("keeps native call and share destinations unchanged", async () => {
    const canOpen = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    act(() => { tree = create(<DetailsActionsRow coffee={{ name: "Café", phoneNumber: "+33200000000", website: "https://example.test" }} addressLine="Rennes" />); });
    const button = (label: string) => tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === label);
    await act(async () => { await button("Appeler").props.onPress(); await button("Partager").props.onPress(); });
    expect(canOpen).toHaveBeenCalledWith("tel:+33200000000");
    expect(open).toHaveBeenCalledWith("tel:+33200000000");
    expect(share).toHaveBeenCalledWith({ message: "Café\nRennes\nhttps://example.test" });
  });

  it("shows a quiet empty photo state and fits cached images to narrow viewports", () => {
    act(() => { tree = create(<PhotosSection photos={[]} />); });
    expect(tree.root.findAllByType(Text).some((node: any) => node.props.children === "Aucune photo pour le moment")).toBe(true);
    expect(tree.root.findAllByType(FlatList)).toHaveLength(0);
    act(() => tree.update(<PhotosSection photos={["file:///cached.jpg"]} />));
    const layout = tree.root.findAll((node: any) => typeof node.props.onLayout === "function")[0];
    act(() => layout.props.onLayout({ nativeEvent: { layout: { width: 220 } } }));
    const photo = tree.root.findByType("NativeCachedImage");
    expect(photo.props.source).toBe("file:///cached.jpg");
    expect(photo.props.cachePolicy).toBe("memory-disk");
    const list = tree.root.findByType(FlatList);
    expect(list.props.snapToInterval).toBeLessThanOrEqual(230);
  });

  it("keeps weekly opening hours available on demand", () => {
    act(() => { tree = create(<InfoSection coffee={{ hours: Array.from({ length: 7 }, () => ({ label: "09:00 – 18:00" })) }} addressLine="Rennes" />); });
    const toggle = tree.root.findByType(Pressable);
    expect(toggle.props.accessibilityState.expanded).toBe(false);
    act(() => toggle.props.onPress());
    expect(tree.root.findByType(Pressable).props.accessibilityState.expanded).toBe(true);
    expect(tree.root.findAllByType(Text).filter((node: any) => node.props.children === "09:00 – 18:00")).toHaveLength(8);
  });
});
