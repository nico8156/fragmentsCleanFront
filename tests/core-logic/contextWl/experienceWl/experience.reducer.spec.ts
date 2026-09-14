import { experienceReducer, initialExperienceState } from "@/app/core-logic/contextWL/experienceWl/reducer/experience.reducer";
import { coffeeExperiencesReceived, experienceOptimisticCreated, experienceOptimisticDeleted, experienceReconciled, experienceOptimisticReported, experienceRollback } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

const entity = (overrides: Partial<ExperienceEntity> = {}): ExperienceEntity => ({ experienceId: "e1", userId: "u1", coffeeId: "c1", authorName: "Nicolas", message: "Très belle visite", status: "PUBLISHED", moderationStatus: "VISIBLE", createdAt: "2026-09-11T10:00:00Z", updatedAt: "2026-09-11T10:00:00Z", version: 0, ...overrides });

describe("experienceReducer", () => {
	it("keeps a deleted experience hidden through late snapshots and an earlier command ACK, but restores on explicit rejection", () => {
		const before = entity({ version: 1 });
		let state = experienceReducer(initialExperienceState, experienceOptimisticCreated({ entity: before }));
		state = experienceReducer(state, experienceOptimisticDeleted({ experienceId: "e1", at: before.updatedAt }));
		state = experienceReducer(state, experienceReconciled({ experienceId: "e1" }));
		state = experienceReducer(state, coffeeExperiencesReceived({ coffeeId: "c1", page: { items: [entity({ version: 2 })] } }));
		expect(state.entities.entities.e1.status).toBe("DELETED");
		state = experienceReducer(state, experienceRollback({ experienceId: "e1", previous: before, preserveDeletion: true }));
		expect(state.entities.entities.e1.status).toBe("DELETED");
		state = experienceReducer(state, experienceRollback({ experienceId: "e1", previous: before }));
		expect(state.entities.entities.e1.status).toBe("PUBLISHED");
	});
	it("does not erase a pending photo when the create projection arrives before the upload", () => {
		const media = [{ mediaId: "m", localUri: "file:///photo.jpg", uploadStatus: "QUEUED" as const, position: 0 }];
		const local = experienceReducer(initialExperienceState, experienceOptimisticCreated({ entity: entity({ optimistic: true, media }) }));
		const refreshed = experienceReducer(local, coffeeExperiencesReceived({ coffeeId: "c1", page: { items: [entity({ version: 1, media: [] })] } }));
		expect(refreshed.entities.entities.e1.media).toEqual(media);
		const confirmed = experienceReducer(refreshed, coffeeExperiencesReceived({ coffeeId: "c1", page: { items: [entity({ version: 2, media: [{ mediaId: "m", url: "https://images.test/photo.jpg", position: 0 }] })] } }));
		expect(confirmed.entities.entities.e1.media?.[0].url).toBe("https://images.test/photo.jpg");
	});
	it("does not replace a newer photo snapshot with an older response", () => {
		const media = [{ mediaId: "m", url: "https://images.test/photo.jpg", position: 0 }];
		const loaded = experienceReducer(initialExperienceState, coffeeExperiencesReceived({ coffeeId: "c1", page: { items: [entity({ version: 2, media })] } }));
		const stale = experienceReducer(loaded, coffeeExperiencesReceived({ coffeeId: "c1", page: { items: [entity({ version: 1, media: [] })] } }));
		expect(stale.entities.entities.e1.media).toEqual(media);
	});
	it("keeps an optimistic experience when an older projection snapshot arrives", () => {
		const optimistic = experienceReducer(initialExperienceState, experienceOptimisticCreated({ entity: entity({ optimistic: true, message: "Version locale", version: 1 }) }));
		const refreshed = experienceReducer(optimistic, coffeeExperiencesReceived({ coffeeId: "c1", page: { items: [entity({ message: "Version serveur ancienne", version: 0 })] } }));
		expect(refreshed.entities.entities.e1?.message).toBe("Version locale");
		expect(refreshed.byCoffee.c1.ids).toContain("e1");
	});

	it("rolls back only an explicit rejected create", () => {
		const optimistic = experienceReducer(initialExperienceState, experienceOptimisticCreated({ entity: entity({ optimistic: true }) }));
		const rejected = experienceReducer(optimistic, experienceRollback({ experienceId: "e1" }));
		expect(rejected.entities.entities.e1).toBeUndefined();
	});

	it("restores a reported experience on explicit rejection without deleting its content", () => {
		const loaded = experienceReducer(initialExperienceState, coffeeExperiencesReceived({ coffeeId: "c1", page: { items: [entity()] } }));
		const hidden = experienceReducer(loaded, experienceOptimisticReported({ experienceId: "e1" }));
		const restored = experienceReducer(hidden, experienceRollback({ experienceId: "e1", reported: true }));

		expect(restored.reportedIds.e1).toBeUndefined();
		expect(restored.entities.entities.e1).toMatchObject(entity());
	});
});
