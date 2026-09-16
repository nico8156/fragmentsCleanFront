import type { ArticlePreviewVM } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import type { DiscoveryCoffeeVM } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import type { PassViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import { createSelector } from "@reduxjs/toolkit";

export const selectHomeExperiences = createSelector(
	[(state: RootStateWl) => state.exState.mine.ids, (state: RootStateWl) => state.exState.entities.entities],
	(ids, entities) => ids.map((id) => entities[id]).filter((item): item is ExperienceEntity => Boolean(item)),
);

export const selectHomeCoffeeNames = createSelector(
	[(state: RootStateWl) => state.cfState.byId],
	(coffees) => Object.fromEntries(Object.entries(coffees).map(([id, coffee]) => [id, coffee.name])),
);

export type HomePassCardVM = {
	title: string;
	detail: string;
	action: "map" | "scan";
	actionLabel: string;
};

export type HomeExperienceVM = {
	id: string;
	coffeeId: string;
	coffeeName: string;
	message: string;
	imageUrl?: string;
	imageMediaId?: string;
};

export type HomeContentVM = {
	coffeeTitle: string;
	coffees: DiscoveryCoffeeVM[];
	pass: HomePassCardVM;
	experiences: HomeExperienceVM[];
	articles: ArticlePreviewVM[];
	publishedArticleCount: number;
};

export function buildHomeContent(input: {
	articles: ArticlePreviewVM[];
	sliderArticles: ArticlePreviewVM[];
	coffees: DiscoveryCoffeeVM[];
	hasLocation: boolean;
	pass: PassViewModel;
	experiences: ExperienceEntity[];
	coffeeNames: Record<string, string | undefined>;
}): HomeContentVM {
	const remaining = input.pass.nextUnlock?.remainingRequirements.find((requirement) => !requirement.completed);
	const ticketRequirement = remaining?.key === "validatedTickets";
	const pass: HomePassCardVM = remaining
		? {
			title: `Encore ${remaining.remaining} ${remaining.label} pour ${input.pass.nextUnlock?.label}`,
			detail: `${remaining.current} sur ${remaining.required}`,
			action: ticketRequirement ? "scan" : "map",
			actionLabel: ticketRequirement ? "Scanner un ticket" : "Trouver un café",
		}
		: {
			title: `Ton Pass : ${input.pass.currentLevel.label}`,
			detail: "Continue à explorer à ton rythme.",
			action: "map",
			actionLabel: "Découvrir un café",
		};

	return {
		coffeeTitle: input.hasLocation ? "Cafés près de toi" : "Cafés à découvrir",
		coffees: input.coffees.slice(0, 5),
		pass,
		experiences: input.experiences
			.filter((experience) => experience.status === "PUBLISHED" && experience.moderationStatus === "VISIBLE")
			.slice(0, 3)
			.map((experience) => ({
				id: experience.experienceId,
				coffeeId: experience.coffeeId,
				coffeeName: input.coffeeNames[experience.coffeeId] ?? "Café visité",
				message: experience.message,
				imageUrl: experience.media?.find((media) => media.url ?? media.localUri)?.url ?? experience.media?.find((media) => media.localUri)?.localUri,
				imageMediaId: experience.media?.find(media => media.url || media.localUri)?.mediaId,
			})),
		articles: input.articles.filter((article) => article.featuredRank === null && !input.sliderArticles.some((slider) => slider.id === article.id)).slice(0, 3),
		publishedArticleCount: input.articles.length,
	};
}
