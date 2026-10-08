import { buildMyExperienceCardViewModel } from "@/app/adapters/secondary/viewModel/myExperienceCardViewModel";


it.each([["REVIEW_REQUIRED","Photo en cours de validation. Elle reste privée."],["REJECTED","Photo refusée. Tu peux la supprimer et en proposer une autre."]])("explains %s without a perpetual synchronization state", (status,label) => {
 const view=buildMyExperienceCardViewModel({status:"PUBLISHED",media:[{mediaId:"m",status,position:0}]} as any);
 expect(view.mediaReviewLabel).toBe(label);
 expect(view.mediaPending).toBe(false);
 expect(view.mediaUri).toBeUndefined();
 expect(view.statusLabel).toBe("Publiée");
});

describe("myExperienceCardViewModel", () => {
	it("does not announce a fully synchronized publication while its photo is pending", () => {
		const view = buildMyExperienceCardViewModel({ status: "PUBLISHED", optimistic: false, media: [{ mediaId: "m", localUri: "file:///photo.jpg", uploadStatus: "QUEUED" }] } as any);
		expect(view.statusTone).toBe("pending");
		expect(view.statusLabel).toBe("Synchronisation…");
	});
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
