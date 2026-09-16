import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { MasterHeader } from "@/app/adapters/primary/react/features/home/components/MasterHeader";

jest.mock("expo-image", () => ({ Image: "ExpoImage" }));
// React's test renderer is the technical native-view boundary, not a business fake.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { create, act } = require("react-test-renderer");
const articles = Array.from({ length: 5 }, (_, index) => ({
  id: `article-${index + 1}`, slug: `article-${index + 1}`, title: `Article ${index + 1}`,
  intro: "Intro", tags: [], featuredRank: index + 1,
  cover: { url: "https://example.test/cover.jpg", width: 400, height: 560 },
}));

describe("Home hero carousel", () => {
  let tree: any;
  afterEach(() => { if (tree) act(() => tree.unmount()); });

  it("pages all five articles and centers its indicators without a fixed left offset", () => {
    act(() => { tree = create(<MasterHeader articles={articles} />); });
    const list = tree.root.findByType(FlatList);
    expect(list.props.data.map((item: any) => item.id)).toEqual(articles.map(item => item.id));
    expect(list.props.scrollEnabled).toBe(true);
    const pagination = tree.root.findByProps({ testID: "hero-pagination" });
    expect(StyleSheet.flatten(pagination.props.style)).toMatchObject({ left: 0, right: 0, justifyContent: "center" });
    const width = list.props.getItemLayout(undefined, 1).length;
    act(() => list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: width } } }));
    expect(tree.root.findByProps({ testID: "hero-pagination" }).props.accessibilityLabel).toBe("Article 2 sur 5");
  });

  it("resets paging after editorial replacement and hides meaningless single-item dots", () => {
    act(() => { tree = create(<MasterHeader articles={articles} />); });
    const list = tree.root.findByType(FlatList);
    const width = list.props.getItemLayout(undefined, 4).length;
    act(() => list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 4 * width } } }));
    act(() => tree.update(<MasterHeader articles={[articles[2]]} />));
    expect(tree.root.findByType(FlatList).props.scrollEnabled).toBe(false);
    expect(tree.root.findAllByProps({ testID: "hero-pagination" })).toHaveLength(0);
    act(() => tree.update(<MasterHeader articles={[...articles].reverse()} />));
    expect(tree.root.findByProps({ testID: "hero-pagination" }).props.accessibilityLabel).toBe("Article 1 sur 5");
  });
});
