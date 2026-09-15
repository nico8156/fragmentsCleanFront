import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

type CurrentUserPublicProfile = {
	displayName?: string;
	avatarUrl?: string;
};

export const withCurrentUserExperienceIdentity = (
	experience: ExperienceEntity,
	effectiveUserId?: string | null,
	currentUser?: CurrentUserPublicProfile | null,
): ExperienceEntity => {
	if (!currentUser || !effectiveUserId || String(experience.userId) !== String(effectiveUserId)) return experience;
	return {
		...experience,
		authorName: currentUser.displayName ?? experience.authorName,
		avatarUrl: currentUser.avatarUrl ?? null,
	};
};
