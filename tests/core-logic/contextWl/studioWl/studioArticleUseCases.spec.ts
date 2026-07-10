import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { submitStudioArticle } from "@/app/core-logic/contextWL/studioWl/usecases/studioArticleUseCases";
import type { StudioGateway } from "@/app/core-logic/contextWL/studioWl/gateway/studioWl.gateway";
import type { CommandStatusGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/commandStatus.gateway";

describe("studio article use cases", () => {
	it("submits an article and observes command status", async () => {
		const studio: StudioGateway = {
			submitArticle: jest.fn(async () => ({
				commandId: "cmd_article_1",
				articleId: "article_1",
				slug: "coffee-guide",
				locale: "fr-FR",
				status: "SUBMITTED",
			})),
			uploadArticleImage: jest.fn(),
			listCafes: jest.fn(),
		};
		const commandStatus: CommandStatusGateway = {
			getStatus: jest.fn(async () => ({ status: "APPLIED", appliedAt: "2026-07-10T10:00:00Z" })),
		};
		const store = initReduxStoreWl({
			dependencies: { gateways: { studio, commandStatus }, helpers: {} as any },
		});

		await store.dispatch<any>(submitStudioArticle({
			adminToken: "admin-token",
			draft: {
				slug: "coffee-guide",
				locale: "fr-FR",
				authorId: "00000000-0000-0000-0000-000000000001",
				authorName: "Fragments Studio",
				title: "Coffee guide",
				intro: "Intro",
				blocks: [{ heading: "Heading", paragraph: "Paragraph" }],
				conclusion: "Conclusion",
				tags: ["coffee"],
				coffeeIds: [],
			},
		}));

		expect(studio.submitArticle).toHaveBeenCalledWith(expect.objectContaining({ adminToken: "admin-token" }));
		expect(commandStatus.getStatus).toHaveBeenCalledWith("cmd_article_1");
		expect(store.getState().stState.articleSubmit).toMatchObject({
			status: "success",
			commandStatus: "APPLIED",
			lastSubmitted: { articleId: "article_1" },
		});
	});
});
