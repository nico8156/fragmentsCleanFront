/** Studio ranks are sparse ordering positions, never slots to fill with unfeatured articles. */
export function selectHomeHeroArticles<T extends { featuredRank?: number | null }>(articles: T[]): T[] {
	const featured = articles.filter(article => article.featuredRank != null).sort((a, b) => a.featuredRank! - b.featuredRank!);
	return featured.length ? featured.slice(0, 5) : articles.slice(0, 1);
}
