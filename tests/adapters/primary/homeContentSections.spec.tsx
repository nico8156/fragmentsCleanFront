import React from "react";
import { Pressable, Text } from "react-native";
import { HomeContentSections } from "@/app/adapters/primary/react/features/home/components/HomeContentSections";
import type { HomeContentVM } from "@/app/adapters/secondary/viewModel/homeContentViewModel";
// Native press target: inspect supplied availability and callbacks without simulating UIKit.
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => ({ __esModule: true, default: "Pressable" }));
jest.mock("expo-image", () => ({ Image: "ExpoImage" }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");

const empty: HomeContentVM = {
	coffeeTitle: "Cafés à découvrir", coffees: [], experiences: [], articles: [], publishedArticleCount: 0,
	pass: { title: "Ton Pass", detail: "Continue à explorer", action: "map", actionLabel: "Découvrir un café" },
};

describe("Home presentation destinations", () => {
	let tree: any;
	afterEach(() => { if (tree) act(() => tree.unmount()); });

	it("keeps empty-state and section destinations available", () => {
		const actions = { onOpenMap: jest.fn(), onOpenScan: jest.fn(), onOpenCoffee: jest.fn(), onOpenArticle: jest.fn(), onOpenArticleCatalogue: jest.fn(), onOpenExperiences: jest.fn(), onOpenPass: jest.fn() };
		act(() => { tree = create(<HomeContentSections content={empty} {...actions} />); });
		for (const label of ["Voir la carte", "Ouvrir la carte", "Trouver un café", "Voir mon Pass", "Tout voir"]) {
			const button = tree.root.findAllByType(Pressable).find((node: any) => node.props.accessibilityLabel === label);
			act(() => button.props.onPress());
		}
		expect(actions.onOpenMap).toHaveBeenCalledTimes(3);
		expect(actions.onOpenPass).toHaveBeenCalledTimes(1);
		expect(actions.onOpenExperiences).toHaveBeenCalledTimes(1);
		expect(actions.onOpenScan).not.toHaveBeenCalled();
	});

	it("opens the coffee and article represented by each compact card", () => {
		const actions = { onOpenMap: jest.fn(), onOpenScan: jest.fn(), onOpenCoffee: jest.fn(), onOpenArticle: jest.fn(), onOpenArticleCatalogue: jest.fn(), onOpenExperiences: jest.fn(), onOpenPass: jest.fn() };
		const content: HomeContentVM = { ...empty,
			coffees: [{ id: "coffee-1", name: "Café exemple", location: { lat: 48, lon: -1 }, tags: [], distanceKm: null, hasPhoto: false }],
			articles: [{ id: "article-1", slug: "une-histoire", title: "Une histoire", intro: "Une introduction", tags: [], featuredRank: null, cover: { url: "https://example.test/cover.jpg", width: 80, height: 92 } }],
			publishedArticleCount: 1,
		};
		act(() => { tree = create(<HomeContentSections content={content} {...actions} />); });
		for (const title of ["Café exemple", "Une histoire"]) {
			const card = tree.root.findAllByType(Pressable).find((node: any) => node.findAllByType(Text).some((text: any) => text.props.children === title));
			act(() => card.props.onPress());
		}
		expect(actions.onOpenCoffee).toHaveBeenCalledWith("coffee-1");
		expect(actions.onOpenArticle).toHaveBeenCalledWith("une-histoire");
	});

	it.each(["scan", "map"] as const)("delegates the Pass prompt to the %s destination supplied by the view model", action => {
		const actions = { onOpenMap: jest.fn(), onOpenScan: jest.fn(), onOpenCoffee: jest.fn(), onOpenArticle: jest.fn(), onOpenArticleCatalogue: jest.fn(), onOpenExperiences: jest.fn(), onOpenPass: jest.fn() };
		act(() => { tree = create(<HomeContentSections content={{ ...empty, pass: { ...empty.pass, action } }} {...actions} />); });
		const prompt = tree.root.findAllByType(Pressable).find((node: any) => node.findAllByType(Text).some((text: any) => text.props.children === "Ton Pass"));
		act(() => prompt.props.onPress());
		expect(actions.onOpenScan).toHaveBeenCalledTimes(action === "scan" ? 1 : 0);
		expect(actions.onOpenMap).toHaveBeenCalledTimes(action === "map" ? 1 : 0);
	});
});
