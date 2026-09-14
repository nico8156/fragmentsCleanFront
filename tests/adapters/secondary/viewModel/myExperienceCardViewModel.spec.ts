import { buildMyExperienceCardViewModel } from "@/app/adapters/secondary/viewModel/myExperienceCardViewModel";

describe("myExperienceCardViewModel", () => {
	it("keeps a long coffee name independent from its synchronization badge", () => {
		const result = buildMyExperienceCardViewModel({
			experienceId: "experience-1",
			coffeeId: "coffee-1",
			message: "Très bon café",
			status: "PUBLISHED",
			moderationStatus: "VISIBLE",
			optimistic: true,
			media: [{ mediaId: "media-1", localUri: "file:///photo.jpg", uploadStatus: "PENDING" }],
		} as any, "BLUEBIRD · Coffee shop rennais. Good vibes only");

		expect(result).toMatchObject({
			coffeeName: "BLUEBIRD · Coffee shop rennais. Good vibes only",
			statusLabel: "Synchronisation…",
			mediaUri: "file:///photo.jpg",
			mediaPending: true,
		});
	});

	it("distinguishes drafts, published and hidden experiences", () => {
		const base = { experienceId: "e", coffeeId: "c", message: "Texte", media: [] };
		expect(buildMyExperienceCardViewModel({ ...base, status: "DRAFT", moderationStatus: "VISIBLE" } as any).statusLabel).toBe("Brouillon");
		expect(buildMyExperienceCardViewModel({ ...base, status: "PUBLISHED", moderationStatus: "VISIBLE" } as any).statusLabel).toBe("Publiée");
		expect(buildMyExperienceCardViewModel({ ...base, status: "PUBLISHED", moderationStatus: "HIDDEN" } as any).statusLabel).toBe("Masquée");
	});
});
