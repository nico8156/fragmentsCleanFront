import React from "react";
import { Provider } from "react-redux";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { PassScreen } from "@/app/adapters/primary/react/features/pass/screens/PassScreen";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { PassContent } from "@/app/adapters/primary/react/features/pass/components/PassContent";
import { TicketsContent } from "@/app/adapters/primary/react/features/profile/components/TicketsContent";
import { ScanTicketContent } from "@/app/adapters/primary/react/features/scan/components/ScanTicketContent";
import { ScanTicketSuccessContent } from "@/app/adapters/primary/react/features/scan/components/ScanTicketSuccessContent";
import { buildPassViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { summarizeTicketHistory, toTicketHistoryItemVM } from "@/app/adapters/secondary/viewModel/useTicketsHistory";
import type { TicketHistoryItemVM } from "@/app/adapters/secondary/viewModel/useTicketsHistory";
import type { TicketAggregate } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { passLevels, passLevelStatuses } from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";

jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-image", () => ({ Image: "NativeImage" }));
jest.mock("expo-symbols", () => ({ SymbolView: "NativeSymbol" }));
jest.mock("@expo/vector-icons", () => ({ FontAwesome: "NativeIcon" }));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView", useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) }));
// Only rendering/native boundaries are mocked. Use the real presentation builders.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

const history = (items: TicketHistoryItemVM[] = []) => ({
    items, recentItems: items.slice(0, 3), archivedItems: items.slice(3), archiveCount: Math.max(0, items.length - 3),
    summary: summarizeTicketHistory(items), isEmpty: items.length === 0,
    isLoading: false, isRefreshing: false, isLoadingMore: false, error: null, hasMore: false,
    refresh: jest.fn(), loadMore: jest.fn(),
});
const ticket = (status: TicketAggregate["status"], index = 0) => toTicketHistoryItemVM({
    ticketId: `t-${status}-${index}`, status, version: 1, optimistic: false,
    merchantName: "Un café avec un nom particulièrement long", amountCents: 650,
    ticketDate: "2026-10-05", updatedAt: "2026-10-05T10:00:00Z", currency: "EUR",
    rejectionReason: status === "REJECTED" ? "Justificatif non reconnu" : undefined,
} as TicketAggregate, {});

describe("Pass, tickets and secondary presentation", () => {
    let tree: any;
    const render = (element: React.ReactElement) => act(() => { tree = create(element); });
    const texts = () => tree.root.findAllByType(Text).map((node: any) => node.props.children).flat().join(" ");
    const button = (label: string) => tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === label);
    afterEach(() => { if (tree) act(() => tree.unmount()); });

    it("keeps the Pass last content above the tab bar without doubling the bottom safe area", () => {
        const store = initReduxStoreWl({ dependencies: {} });
        render(<Provider store={store}><PassScreen /></Provider>);
        expect(tree.root.findByType("SafeAreaView").props.edges).toEqual(["top", "left", "right"]);
        expect(StyleSheet.flatten(tree.root.findByProps({ testID: "scroll-clearance" }).props.style)).not.toHaveProperty("marginBottom");
        expect(tree.root.findAllByType(ScrollView)).toHaveLength(1);
        expect(StyleSheet.flatten(tree.root.findByType(ScrollView).props.contentContainerStyle).paddingBottom).toBeGreaterThanOrEqual(126);
    });

    it("renders missing Pass data as synchronization pending without invented requirements", () => {
        render(<PassContent vm={buildPassViewModel({})} />);
        expect(texts()).toContain("Progression en attente de synchronisation.");
        expect(texts()).toContain("Verrouillé");
        expect(texts()).not.toContain("Encore");
    });

    it.each([passLevelStatuses.IN_PROGRESS, passLevelStatuses.COMPLETED])("renders backend-owned Pass status %s and requirements", status => {
        const vm = buildPassViewModel({ entitlements: {
            userId: "u", confirmedTickets: 0, rights: [], rightsSource: "backend",
            pass: { currentLevel: passLevels.COFFEE_TASTER, policyVersion: 2,
                counters: { publishedExperiences: 1, distinctExperiencedCoffees: 0, validatedTickets: 0 },
                levels: [{ level: passLevels.COFFEE_TASTER, status, requirements: { publishedExperiences: 2 }, unlockedCapabilities: [] }],
            },
        } });
        render(<PassContent vm={vm} />);
        expect(texts()).toContain("1 / 2");
        expect(texts()).toContain(status === passLevelStatuses.COMPLETED ? "Atteint" : "En cours");
        expect(texts()).toContain(String(vm.currentLevel.progressPercent));
    });

    it("renders ticket names, dates, amounts and textual statuses", () => {
        render(<TicketsContent vm={history([ticket("CONFIRMED"), ticket("ANALYZING"), ticket("REJECTED")])} />);
        expect(texts()).toContain("Validé"); expect(texts()).toContain("Analyse en cours"); expect(texts()).toContain("Refusé");
        expect(texts()).toContain("Justificatif non reconnu"); expect(texts()).toContain("octobre"); expect(texts()).toContain("6,50");
        const name = tree.root.findAllByType(Text).find((node: any) => node.props.children === "Un café avec un nom particulièrement long");
        expect(name.props.numberOfLines).toBeUndefined();
    });

    it("distinguishes empty tickets from loading and a failed initial read", () => {
        const vm = history();
        render(<TicketsContent vm={vm} />);
        expect(texts()).toContain("Aucun ticket dans ton historique");
        act(() => tree.update(<TicketsContent vm={{ ...vm, isLoading: true }} />));
        expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
        expect(texts()).not.toContain("Aucun ticket");
        act(() => tree.update(<TicketsContent vm={{ ...vm, error: "offline" }} />));
        expect(texts()).toContain("Historique indisponible");
        const retry = button("Actualiser les tickets");
        expect(StyleSheet.flatten(retry.props.style).minHeight).toBeGreaterThanOrEqual(44);
        act(() => retry.props.onPress()); expect(vm.refresh).toHaveBeenCalledTimes(1);
    });

    it("keeps cached tickets visible on error and supports archive expansion and loading more", () => {
        const vm = { ...history([ticket("CONFIRMED", 1), ticket("CONFIRMED", 2), ticket("CONFIRMED", 3), ticket("FAILED", 4)]), error: "offline", hasMore: true };
        render(<TicketsContent vm={vm} />);
        expect(texts()).toContain("données enregistrées affichées");
        expect(texts()).not.toContain("Analyse interrompue");
        act(() => button("Afficher 1 anciens tickets").props.onPress());
        expect(button("Masquer les anciens tickets").props.accessibilityState.expanded).toBe(true);
        expect(texts()).toContain("Analyse interrompue");
        act(() => button("Charger la suite des tickets").props.onPress()); expect(vm.loadMore).toHaveBeenCalledTimes(1);
        act(() => tree.update(<TicketsContent vm={{ ...vm, isLoadingMore: true }} />));
        expect(button("Charger la suite des tickets").props.accessibilityState).toEqual({ disabled: true, busy: true });
    });

    it("keeps permission errors, photo processing and submit availability visible", () => {
        const vm = { imageUri: null, photoStatus: "unknown" as const, isProcessing: false, error: "Autorise l'appareil photo pour scanner ton ticket.", canSubmit: false, onPickImage: jest.fn(), onSubmit: jest.fn() };
        render(<ScanTicketContent vm={vm} />);
        expect(tree.root.findAllByType(Text).find((node: any) => node.props.children === vm.error).props.accessibilityRole).toBe("alert");
        expect(button("Envoyer le ticket").props.disabled).toBe(true);
        act(() => button("Prendre une photo du ticket").props.onPress()); expect(vm.onPickImage).toHaveBeenCalledTimes(1);
        act(() => tree.update(<ScanTicketContent vm={{ ...vm, error: null, imageUri: "file:///ticket.jpg", isProcessing: true }} />));
        expect(texts()).toContain("Vérification de la photo…");
        expect(button("Envoyer le ticket").props.accessibilityState.busy).toBe(true);
        act(() => tree.update(<ScanTicketContent vm={{ ...vm, error: null, imageUri: "file:///ticket.jpg", photoStatus: "ok", canSubmit: true }} />));
        expect(texts()).toContain("Photo lisible");
        act(() => button("Envoyer le ticket").props.onPress()); expect(vm.onSubmit).toHaveBeenCalledTimes(1);
    });

    it("keeps success actions accessible inside a scrolling safe-area layout", () => {
        const onTickets = jest.fn(), onPass = jest.fn();
        render(<ScanTicketSuccessContent onTickets={onTickets} onPass={onPass} />);
        expect(tree.root.findAllByType(ScrollView)).toHaveLength(1);
        act(() => button("Voir mes tickets").props.onPress());
        act(() => button("Retour au Pass").props.onPress());
        expect(onTickets).toHaveBeenCalledTimes(1); expect(onPass).toHaveBeenCalledTimes(1);
        expect(StyleSheet.flatten(button("Retour au Pass").props.style({ pressed: false })).minHeight).toBeGreaterThanOrEqual(44);
    });
});
