import React from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { ExperiencePhoto } from "@/app/adapters/primary/react/features/experiences/components/ExperiencePhoto";
import { ExperienceComposer } from "@/app/adapters/primary/react/features/experiences/components/ExperienceComposer";
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-image", () => ({ Image: "NativeCachedImage" }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

describe("experience media and contribution presentation", () => {
  let tree: any;
  afterEach(() => { if (tree) act(() => tree.unmount()); });

  it("keeps local media local and uses the stable media cache identity after reconciliation", () => {
    act(() => { tree = create(<ExperiencePhoto uri="file:///durable.jpg" mediaId="m" label="Photo" />); });
    let photo = tree.root.findByType("NativeCachedImage");
    expect(photo.props.source).toEqual({ uri: "file:///durable.jpg", cacheKey: undefined });
    act(() => tree.update(<ExperiencePhoto uri="https://example.test/remote.jpg" mediaId="m" label="Photo" />));
    photo = tree.root.findByType("NativeCachedImage");
    expect(photo.props.source.cacheKey).toBe("experience-media:m");
    expect(photo.props.cachePolicy).toBe("memory-disk");
  });

  it("keeps an unavailable preview explicit and renders a replacement URI", () => {
    act(() => { tree = create(<ExperiencePhoto uri="file:///missing.jpg" label="Photo" />); });
    act(() => tree.root.findByType("NativeCachedImage").props.onError());
    expect(tree.root.findAllByType("NativeCachedImage")).toHaveLength(0);
    expect(tree.root.findAllByType(Text).some((node: any) => node.props.children === "L’aperçu de la photo n’est pas disponible.")).toBe(true);
    act(() => tree.update(<ExperiencePhoto uri="file:///replacement.jpg" label="Photo" />));
    expect(tree.root.findByType("NativeCachedImage").props.source.uri).toBe("file:///replacement.jpg");
  });

  it("preserves the compact Home media size", () => {
    act(() => { tree = create(<ExperiencePhoto uri="file:///photo.jpg" label="Photo" compact />); });
    expect(StyleSheet.flatten(tree.root.findByType("NativeCachedImage").props.style)).toMatchObject({ height: 108, aspectRatio: undefined, borderRadius: 0 });
  });

  it("delegates input, photo and the two submission intentions without changing availability", () => {
    const props = { message: "", canSubmit: false, onChangeMessage: jest.fn(), onChoosePhoto: jest.fn(), onRemovePhoto: jest.fn(), onSaveDraft: jest.fn(), onPublish: jest.fn() };
    act(() => { tree = create(<ExperienceComposer {...props} />); });
    const button = (label: string) => tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === label);
    expect(button("Partager mon expérience").props.disabled).toBe(true);
    expect(button("Enregistrer en brouillon").props.disabled).toBe(true);
    act(() => tree.root.findByType(TextInput).props.onChangeText("Ma visite"));
    expect(props.onChangeMessage).toHaveBeenCalledWith("Ma visite");
    act(() => button("Ajouter une photo").props.onPress());
    expect(props.onChoosePhoto).toHaveBeenCalledTimes(1);
    act(() => tree.update(<ExperienceComposer {...props} message="Ma visite" canSubmit photoUri="file:///ready.jpg" photoError="Erreur de préparation" />));
    expect(tree.root.findByType(TextInput).props.value).toBe("Ma visite");
    expect(StyleSheet.flatten(tree.root.findByProps({ testID: "composer-photo-preview" }).props.style)).toMatchObject({ width: 144, maxWidth: "100%" });
    expect(tree.root.findByType("NativeCachedImage").props.source.uri).toBe("file:///ready.jpg");
    expect(tree.root.findAllByType(Text).find((node: any) => node.props.children === "Erreur de préparation").props.accessibilityRole).toBe("alert");
    for (const label of ["Retirer la photo", "Partager mon expérience", "Enregistrer en brouillon"]) act(() => button(label).props.onPress());
    expect(props.onRemovePhoto).toHaveBeenCalledTimes(1);
    expect(props.onPublish).toHaveBeenCalledTimes(1);
    expect(props.onSaveDraft).toHaveBeenCalledTimes(1);
  });
});
