import React from "react";
import { Alert, Pressable, Text, TextInput } from "react-native";
import { ExperienceCard } from "@/app/adapters/primary/react/features/cafes/components/ExperiencesSection";
import { MyExperienceCard } from "@/app/adapters/primary/react/features/experiences/components/MyExperienceCard";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-image", () => ({ Image: "NativeCachedImage" }));
jest.mock("@/app/adapters/secondary/gateways/media/pickDurableImage", () => ({ pickDurableImage: jest.fn(), discardDurableImage: jest.fn() }));
// Native rendering and photo picker only; callbacks exercise the presentation boundary.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");
const item = { experienceId: "e", coffeeId: "c", message: "Un espresso doux", status: "PUBLISHED", moderationStatus: "VISIBLE", media: [] } as unknown as ExperienceEntity;

describe("experience reading and secondary actions", () => {
  let tree: any;
  let props: React.ComponentProps<typeof MyExperienceCard>;
  const buttons = (label: string) => tree.root.findAllByType(Pressable).filter((node: any) => node.props.accessibilityLabel === label);
  const press = (label: string) => act(() => buttons(label)[0].props.onPress());
  beforeEach(() => { props = { item, coffeeName: "Bourbon d’Arsel — Torréfacteur et Coffee Shop", onUpdate: jest.fn(), onPublish: jest.fn(), onDelete: jest.fn(), onAddPhoto: jest.fn().mockResolvedValue(undefined), onDeletePhoto: jest.fn() }; });
  afterEach(() => { if (tree) act(() => tree.unmount()); jest.restoreAllMocks(); });

  it("keeps the full place name and reveals management only on demand", () => {
    act(() => { tree = create(<MyExperienceCard {...props} />); });
    expect(tree.root.findAllByType(Text).find((node: any) => node.props.children === props.coffeeName).props.numberOfLines).toBeUndefined();
    expect(buttons("Modifier")).toHaveLength(0);
    expect(buttons("Supprimer")).toHaveLength(0);
    expect(buttons("Options de l’expérience")[0].props.accessibilityState.expanded).toBe(false);
    press("Options de l’expérience");
    expect(buttons("Modifier")).toHaveLength(1);
    expect(buttons("Supprimer")).toHaveLength(1);
    press("Options de l’expérience");
    expect(buttons("Modifier")).toHaveLength(0);
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it("delegates an edit and keeps deletion behind its existing confirmation", () => {
    const alert = jest.spyOn(Alert, "alert");
    act(() => { tree = create(<MyExperienceCard {...props} />); });
    press("Options de l’expérience"); press("Modifier");
    act(() => tree.root.findByType(TextInput).props.onChangeText("  Très bon espresso  "));
    press("Enregistrer");
    expect(props.onUpdate).toHaveBeenCalledWith("Très bon espresso");
    press("Supprimer");
    expect(props.onDelete).not.toHaveBeenCalled();
    const actions = alert.mock.calls[0][2]!;
    act(() => actions.find(action => action.style === "destructive")!.onPress!());
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it("keeps pending media visible with options folded and confirms photo deletion", () => {
    const alert = jest.spyOn(Alert, "alert");
    act(() => { tree = create(<MyExperienceCard {...props} item={{ ...item, media: [{ mediaId: "m", localUri: "file:///durable.jpg", uploadStatus: "QUEUED" }] } as ExperienceEntity} />); });
    expect(tree.root.findAllByType(Text).some((node: any) => node.props.children === "Photo en attente de synchronisation…")).toBe(true);
    expect(buttons("Supprimer la photo")).toHaveLength(0);
    press("Options de l’expérience"); press("Supprimer la photo");
    expect(props.onDeletePhoto).not.toHaveBeenCalled();
    act(() => alert.mock.calls[0][2]!.find(action => action.style === "destructive")!.onPress!());
    expect(props.onDeletePhoto).toHaveBeenCalledWith("m");
  });

  it("folds all public-card management while keeping media pending visible", () => {
    const onDeletePhoto = jest.fn();
    const publicItem = { ...item, isAuthor: true, createdAt: "2026-10-05", media: [{ mediaId: "m", localUri: "file:///durable.jpg", uploadStatus: "QUEUED" }] } as ExperienceEntity & { isAuthor: boolean };
    act(() => { tree = create(<ExperienceCard item={publicItem} onEdit={jest.fn()} onDelete={jest.fn()} onReport={jest.fn()} onBlock={jest.fn()} onAddPhoto={jest.fn()} onDeletePhoto={onDeletePhoto} />); });
    const visibleText = () => tree.root.findAllByType(Text).map((node: any) => node.props.children);
    for (const label of ["Modifier", "Supprimer", "Supprimer la photo"]) expect(visibleText()).not.toContain(label);
    expect(visibleText()).toContain("Photo en attente de synchronisation…");
    press("Options de l’expérience");
    for (const label of ["Modifier", "Supprimer", "Supprimer la photo"]) expect(visibleText()).toContain(label);
    press("Supprimer la photo");
    expect(onDeletePhoto).toHaveBeenCalledWith("e", "m");
    press("Options de l’expérience");
    expect(visibleText()).not.toContain("Supprimer la photo");
    expect(visibleText()).toContain("Photo en attente de synchronisation…");
  });

  it("keeps several visits readable with independent menus and a visible draft publish action", () => {
    const visits = [
      { ...item, experienceId: "draft", status: "DRAFT" },
      { ...item, experienceId: "pending", optimistic: true },
      { ...item, experienceId: "published" },
      { ...item, experienceId: "hidden", moderationStatus: "HIDDEN" },
    ] as ExperienceEntity[];
    act(() => { tree = create(<>{visits.map(visit => <MyExperienceCard {...props} key={visit.experienceId} item={visit} coffeeName={visit.experienceId} />)}</>); });
    expect(buttons("Options de l’expérience")).toHaveLength(4);
    expect(buttons("Modifier")).toHaveLength(0);
    expect(buttons("Supprimer")).toHaveLength(0);
    expect(buttons("Supprimer la photo")).toHaveLength(0);
    expect(buttons("Publier")).toHaveLength(1);
    const text = tree.root.findAllByType(Text).map((node: any) => node.props.children);
    for (const label of ["Brouillon", "Synchronisation…", "Publiée", "Masquée"]) expect(text).toContain(label);
    act(() => buttons("Options de l’expérience")[1].props.onPress());
    expect(buttons("Modifier")).toHaveLength(1);
    expect(buttons("Options de l’expérience").map((node: any) => node.props.accessibilityState.expanded)).toEqual([false, true, false, false]);
  });

  it("keeps a media preparation error visible after closing options", async () => {
    props.onAddPhoto = jest.fn().mockRejectedValue(new Error("Photo indisponible"));
    act(() => { tree = create(<MyExperienceCard {...props} />); });
    press("Options de l’expérience");
    await act(async () => buttons("Ajouter une photo")[0].props.onPress());
    press("Options de l’expérience");
    expect(tree.root.findAllByType(Text).find((node: any) => node.props.children === "Photo indisponible").props.accessibilityRole).toBe("alert");
  });

  it.each([
    [{ status: "DRAFT" }, "Brouillon"],
    [{ optimistic: true }, "Synchronisation…"],
    [{ moderationStatus: "HIDDEN" }, "Masquée"],
    [{}, "Publiée"],
  ])("keeps status %s visible while options are folded", (overrides, label) => {
    act(() => { tree = create(<MyExperienceCard {...props} item={{ ...item, ...overrides } as ExperienceEntity} />); });
    expect(tree.root.findAllByType(Text).some((node: any) => node.props.children === label)).toBe(true);
    expect(buttons("Publier")).toHaveLength(label === "Brouillon" ? 1 : 0);
    if (label === "Brouillon") { press("Publier"); expect(props.onPublish).toHaveBeenCalledTimes(1); }
  });
});
