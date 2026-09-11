import { experienceReducer, initialExperienceState } from "@/app/core-logic/contextWL/experienceWl/reducer/experience.reducer";
import { coffeeExperiencesReceived, experienceOptimisticCreated, experienceOptimisticReported, experienceRollback } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

const entity = (overrides: Partial<ExperienceEntity> = {}): ExperienceEntity => ({ experienceId: "e1", userId: "u1", coffeeId: "c1", authorName: "Nicolas", message: "Très belle visite", status: "PUBLISHED", moderationStatus: "VISIBLE", createdAt: "2026-09-11T10:00:00Z", updatedAt: "2026-09-11T10:00:00Z", version: 0, ...overrides });

describe("experienceReducer", () => {
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
