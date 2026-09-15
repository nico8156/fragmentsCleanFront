import { withCurrentUserExperienceIdentity } from "@/app/adapters/secondary/viewModel/experienceIdentityViewModel";

const experience = {
	experienceId: "experience-1",
	userId: "user-1",
	coffeeId: "coffee-1",
	authorName: "Ancien nom",
	avatarUrl: "https://old.test/avatar.jpg",
};

describe("experienceIdentityViewModel", () => {
	it("overlays the current profile on the current user's projected experience", () => {
		const result = withCurrentUserExperienceIdentity(
			experience as any,
			"user-1",
			{ displayName: "Nouveau nom", avatarUrl: undefined },
		);

		expect(result.authorName).toBe("Nouveau nom");
		expect(result.avatarUrl).toBeNull();
	});

	it("does not alter another user's projected identity", () => {
		const result = withCurrentUserExperienceIdentity(
			experience as any,
			"another-user",
			{ displayName: "Nouveau nom", avatarUrl: undefined },
		);

		expect(result).toBe(experience);
	});
});
