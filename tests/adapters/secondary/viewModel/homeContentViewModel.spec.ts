import { buildHomeContent, selectHomeCoffeeNames, selectHomeExperiences } from "@/app/adapters/secondary/viewModel/homeContentViewModel";
import { selectHomeHeroArticles } from "@/app/adapters/secondary/viewModel/useArticlesHome";

const article = (id: string, featuredRank: number | null = null) => ({ id, slug: id, title: id, intro: "intro", tags: [], featuredRank, cover: { url: "https://example.test/image.jpg", width: 1, height: 1, alt: id } });
const pass: any = { currentLevel: { label: "Coffee Taster" }, nextUnlock: { label: "Urban Explorer", remainingRequirements: [{ key: "validatedTickets", label: "tickets validés", remaining: 1, current: 0, required: 1, completed: false }] } };

describe("buildHomeContent", () => {
	it("keeps the media identity for both recent local photos and older remote photos", () => {
		const experiences = [
			{ experienceId: "recent", media: [{ mediaId: "local-media", localUri: "file:///photo.jpg" }] },
			{ experienceId: "older", media: [{ mediaId: "remote-media", url: "https://images.test/signed.jpg" }] },
		].map(item => ({ ...item, status: "PUBLISHED", moderationStatus: "VISIBLE", message: "Visite", coffeeId: "c" }));
		const result = buildHomeContent({ articles: [], sliderArticles: [], coffees: [], hasLocation: false, pass, experiences: experiences as any, coffeeNames: {} });
		expect(result.experiences.map(item => [item.imageMediaId, item.imageUrl])).toEqual([
			["local-media", "file:///photo.jpg"], ["remote-media", "https://images.test/signed.jpg"],
		]);
	});
	it("memoizes the Redux-derived inputs consumed by Home", () => {
		const state: any = { exState: { mine: { ids: ["experience-1"] }, entities: { entities: { "experience-1": { experienceId: "experience-1" } } } }, cfState: { byId: { "coffee-1": { name: "Café" } } } };
		expect(selectHomeExperiences(state)).toBe(selectHomeExperiences(state));
		expect(selectHomeCoffeeNames(state)).toBe(selectHomeCoffeeNames(state));
	});
	it("compose des lectures existantes sans créer de contenu fictif", () => {
		const result = buildHomeContent({ articles: [article("hero"), article("next")], sliderArticles: [article("hero")], coffees: [{ id: "coffee-1", name: "Café", location: { lat: 48.86, lon: 2.35 }, city: "Paris", tags: [], distanceKm: 1, hasPhoto: false }], hasLocation: true, pass, experiences: [{ experienceId: "visible", coffeeId: "coffee-1", userId: "u", message: "Très bon espresso", status: "PUBLISHED", moderationStatus: "VISIBLE", createdAt: "", updatedAt: "", version: 1 }, { experienceId: "hidden", coffeeId: "coffee-1", userId: "u", message: "hidden", status: "PUBLISHED", moderationStatus: "HIDDEN", createdAt: "", updatedAt: "", version: 1 }] as any, coffeeNames: { "coffee-1": "Café" } });
		expect(result.coffeeTitle).toBe("Cafés à découvrir près de toi");
		expect(result.pass.action).toBe("scan");
		expect(result.experiences).toEqual([expect.objectContaining({ id: "visible", coffeeName: "Café" })]);
		expect(result.articles.map((item) => item.id)).toEqual(["next"]);
		expect(result.publishedArticleCount).toBe(2);
	});

	it("oriente vers la carte lorsqu'une étape ne requiert pas de ticket", () => {
		const result = buildHomeContent({ articles: [], sliderArticles: [], coffees: [], hasLocation: false, pass: { ...pass, nextUnlock: { label: "Urban Explorer", remainingRequirements: [{ key: "publishedExperiences", label: "expériences publiées", remaining: 2, current: 0, required: 2, completed: false }] } }, experiences: [], coffeeNames: {} });
		expect(result.coffeeTitle).toBe("Cafés à découvrir");
		expect(result.pass.action).toBe("map");
	});

	it("borne les carrousels et choisit les articles suivants dans l'ordre éditorial", () => {
		const result = buildHomeContent({
			articles: Array.from({ length: 10 }, (_, index) => article(`article-${index + 1}`)),
			sliderArticles: [article("article-1"), article("article-2")],
			coffees: Array.from({ length: 8 }, (_, index) => ({ id: `coffee-${index}`, name: `Café ${index}`, location: { lat: 48.1, lon: -1.6 }, city: "Rennes", tags: [], distanceKm: index, hasPhoto: false })),
			pass,
			hasLocation: true,
			experiences: Array.from({ length: 6 }, (_, index) => ({ experienceId: `experience-${index}`, coffeeId: `coffee-${index}`, userId: "u", message: `Visite ${index}`, status: "PUBLISHED", moderationStatus: "VISIBLE", createdAt: "", updatedAt: "", version: 1 })) as any,
			coffeeNames: {},
		});

		expect(result.coffees).toHaveLength(5);
		expect(result.experiences).toHaveLength(3);
		expect(result.articles.map((item) => item.id)).toEqual(["article-3", "article-4", "article-5"]);
	});
	it("uses Studio ranks for the hero and recent non-featured publications for À lire ensuite", () => {
		const published = [article("newest"), article("rank-3", 3), article("second"), article("rank-1", 1), article("third")];
		const hero = selectHomeHeroArticles(published);
		expect(hero.map(item => item.id)).toEqual(["rank-1", "rank-3"]);
		const content = buildHomeContent({ articles: published, sliderArticles: hero, coffees: [], hasLocation: false, pass, experiences: [], coffeeNames: {} });
		expect(content.articles.map(item => item.id)).toEqual(["newest", "second", "third"]);
	});
	it("preserves a single editorial hero until Studio has curated the first featured article", () => {
		const published = [article("newest"), article("next")];
		const hero = selectHomeHeroArticles(published);
		expect(hero.map(item => item.id)).toEqual(["newest"]);
		const content = buildHomeContent({ articles: published, sliderArticles: hero, coffees: [], hasLocation: false, pass, experiences: [], coffeeNames: {} });
		expect(content.articles.map(item => item.id)).toEqual(["next"]);
	});
});
