import { BadgeProgress } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

export type BadgeRequirements = {
    exploration: number;
    gout: number;
    social: number;
};

export type BadgeDefinition = {
    id: string;
    label: string;
    description: string;
    requirements: BadgeRequirements;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        id: "urban_explorer",
        label: "Urban Explorer",
        description: "Tu explores la ville café après café.",
        requirements: {
            exploration: 5,
            gout: 0,
            social: 0,
        },
    },
    {
        id: "coffee_taster",
        label: "Coffee Taster",
        description: "Tu dégustes régulièrement dans les cafés visités.",
        requirements: {
            exploration: 0,
            gout: 1,
            social: 0,
        },
    },
    {
        id: "social_bean",
        label: "Social Bean",
        description: "Tu contribues activement à la communauté.",
        requirements: {
            exploration: 0,
            gout: 0,
            social: 10,
        },
    },
    {
        id: "fragments_master",
        label: "Fragments Master",
        description: "Exploration, goût, interaction : tu maîtrises tout.",
        requirements: {
            exploration: 5,
            gout: 3,
            social: 5,
        },
    },
];

export const getDefaultBadgeProgress = (): BadgeProgress => ({
    exploration: 0,
    gout: 0,
    social: 0,
    unlockedBadges: [],
});

export const isBadgeUnlocked = (progress: BadgeProgress, badge: BadgeDefinition) =>
    progress.exploration >= badge.requirements.exploration &&
    progress.gout >= badge.requirements.gout &&
    progress.social >= badge.requirements.social;

export const computeUnlockedBadges = (progress: BadgeProgress): string[] =>
    BADGE_DEFINITIONS.filter((badge) => isBadgeUnlocked(progress, badge)).map((badge) => badge.id);

export const clampProgressToRequirements = (progress: BadgeProgress, badge: BadgeDefinition) => ({
    exploration: Math.min(progress.exploration, badge.requirements.exploration),
    gout: Math.min(progress.gout, badge.requirements.gout),
    social: Math.min(progress.social, badge.requirements.social),
});

export const computeBadgeCompletion = (progress: BadgeProgress, badge: BadgeDefinition) => {
    const clamped = clampProgressToRequirements(progress, badge);
    const totalRequired =
        badge.requirements.exploration + badge.requirements.gout + badge.requirements.social || 1;
    const current = clamped.exploration + clamped.gout + clamped.social;
    return current / totalRequired;
};
