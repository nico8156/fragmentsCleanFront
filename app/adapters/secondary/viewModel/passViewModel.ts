import { palette } from "@/app/adapters/primary/react/css/colors";
import {
	PassCounters,
	PassLevel,
	passLevels,
	PassLevelSnapshot,
	PassProgressSnapshot,
	PassRequirements,
	passLevelStatuses,
	UserEntitlements,
} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";
import type { AppUser } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

export type PassRingStatus = "locked" | "inProgress" | "completed";

export type PassRingViewModel = {
	level: PassLevel;
	label: string;
	progress: number;
	status: PassRingStatus;
	progressColor: string;
	completedColor: string;
	trackColor: string;
};

export type PassRequirementViewModel = {
	key: keyof PassRequirements;
	label: string;
	current: number;
	required: number;
	remaining: number;
	completed: boolean;
};

export type PassLevelViewModel = {
	level: PassLevel;
	label: string;
	status: PassRingStatus;
	progressPercent: number;
	requirements: PassRequirementViewModel[];
	unlockedLabel?: string;
};

export type PassViewModel = {
	title: string;
	profileImageUrl?: string;
	userName: string;
	currentLevel: PassLevelViewModel;
	rings: PassRingViewModel[];
	completedRings: PassRingViewModel[];
	counters: {
		tickets: number;
		comments: number;
		likes: number;
	};
	nextUnlock?: {
		label: string;
		remainingRequirements: PassRequirementViewModel[];
	};
	accessibilityLabel: string;
};

const levelLabels: Record<PassLevel, string> = {
	[passLevels.COFFEE_TASTER]: "Coffee Taster",
	[passLevels.URBAN_EXPLORER]: "Urban Explorer",
	[passLevels.SOCIAL_BEAN]: "Social Bean",
	[passLevels.FRAGMENTS_MASTER]: "Fragments Master",
};

const unlockLabels: Record<string, string> = {
	SCAN: "Scan",
	COMMENT: "Commentaires",
	LIKE: "Likes",
};

const ringColors: Record<PassLevel, { progress: string; completed: string }> = {
	[passLevels.COFFEE_TASTER]: { progress: palette.accent, completed: palette.accent },
	[passLevels.URBAN_EXPLORER]: { progress: palette.primary_90, completed: palette.primary_90 },
	[passLevels.SOCIAL_BEAN]: { progress: palette.success, completed: palette.success },
	[passLevels.FRAGMENTS_MASTER]: { progress: palette.textPrimary, completed: palette.textPrimary },
};

const orderedLevels: PassLevel[] = [
	passLevels.COFFEE_TASTER,
	passLevels.URBAN_EXPLORER,
	passLevels.SOCIAL_BEAN,
	passLevels.FRAGMENTS_MASTER,
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const toRingStatus = (status?: string): PassRingStatus => {
	if (status === passLevelStatuses.COMPLETED) return "completed";
	if (status === passLevelStatuses.IN_PROGRESS) return "inProgress";
	return "locked";
};

const requirementSpecs: Array<{
	key: keyof PassRequirements;
	counterKey: keyof PassCounters;
	label: string;
}> = [
	{ key: "validatedTickets", counterKey: "validatedTickets", label: "tickets validés" },
	{ key: "publishedComments", counterKey: "publishedComments", label: "commentaires publiés" },
	{ key: "confirmedLikes", counterKey: "confirmedLikes", label: "likes confirmés" },
];

const buildRequirements = (
	requirements: PassRequirements,
	counters: PassCounters,
): PassRequirementViewModel[] =>
	requirementSpecs
		.map((spec) => {
			const required = requirements[spec.key];
			if (typeof required !== "number") return null;
			const current = counters[spec.counterKey] ?? 0;
			return {
				key: spec.key,
				label: spec.label,
				current,
				required,
				remaining: Math.max(0, required - current),
				completed: current >= required,
			};
		})
		.filter(Boolean) as PassRequirementViewModel[];

const computeProgress = (
	level: PassLevelSnapshot,
	counters: PassCounters,
): number => {
	if (level.status === passLevelStatuses.COMPLETED) return 1;
	if (level.status === passLevelStatuses.LOCKED) return 0;

	const requirements = buildRequirements(level.requirements ?? {}, counters);
	if (!requirements.length) return level.level === passLevels.FRAGMENTS_MASTER ? 1 : 0;
	const normalized = requirements.map((req) => clamp01(req.current / req.required));
	return normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
};

const fallbackLevels = (): PassLevelSnapshot[] =>
	orderedLevels.map((level, index) => ({
		level,
		status: index === 0 ? passLevelStatuses.IN_PROGRESS : passLevelStatuses.LOCKED,
		requirements:
			level === passLevels.COFFEE_TASTER
				? { validatedTickets: 3 }
				: level === passLevels.URBAN_EXPLORER
					? { validatedTickets: 5, publishedComments: 3 }
					: level === passLevels.SOCIAL_BEAN
						? { validatedTickets: 10, publishedComments: 5, confirmedLikes: 5 }
						: {},
		unlockedCapabilities:
			level === passLevels.COFFEE_TASTER
				? ["SCAN"]
				: level === passLevels.URBAN_EXPLORER
					? ["COMMENT"]
					: level === passLevels.SOCIAL_BEAN
						? ["LIKE"]
						: [],
	}));

const selectCurrentLevel = (
	levels: PassLevelSnapshot[],
	currentLevel?: PassLevel,
) =>
	levels.find((level) => level.level === currentLevel) ??
	levels.find((level) => level.status === passLevelStatuses.IN_PROGRESS) ??
	levels.find((level) => level.status !== passLevelStatuses.COMPLETED) ??
	levels[levels.length - 1];

export const buildPassViewModel = (
	input: {
		user?: AppUser;
		entitlements?: UserEntitlements;
	}
): PassViewModel => {
	const pass: PassProgressSnapshot | undefined = input.entitlements?.pass;
	const counters = pass?.counters ?? {
		validatedTickets: input.entitlements?.confirmedTickets ?? 0,
		publishedComments: input.entitlements?.publishedComments ?? 0,
		confirmedLikes: input.entitlements?.confirmedLikes ?? 0,
	};
	const levels = pass?.levels?.length ? pass.levels : fallbackLevels();
	const current = selectCurrentLevel(levels, pass?.currentLevel) ?? fallbackLevels()[0];

	const rings = orderedLevels.map((level) => {
		const snapshot = levels.find((item) => item.level === level) ?? fallbackLevels().find((item) => item.level === level)!;
		const colors = ringColors[level];
		const status = toRingStatus(snapshot.status);
		return {
			level,
			label: levelLabels[level],
			progress: computeProgress(snapshot, counters),
			status,
			progressColor: colors.progress,
			completedColor: colors.completed,
			trackColor: status === "locked" ? palette.border_30 : palette.border_70,
		};
	});

	const currentRequirements = buildRequirements(current.requirements ?? {}, counters);
	const currentProgress = computeProgress(current, counters);
	const currentStatus = toRingStatus(current.status);
	const unlock = current.unlockedCapabilities?.[0];
	const currentLevelVm: PassLevelViewModel = {
		level: current.level,
		label: levelLabels[current.level],
		status: currentStatus,
		progressPercent: Math.round(currentProgress * 100),
		requirements: currentRequirements,
		unlockedLabel: unlock ? unlockLabels[unlock] ?? unlock : undefined,
	};

	const nextUnlock = currentLevelVm.unlockedLabel
		? {
			label: currentLevelVm.unlockedLabel,
			remainingRequirements: currentRequirements.filter((req) => !req.completed),
		}
		: undefined;

	const profileImageUrl = input.user?.avatarUrl;
	const userName = input.user?.displayName ?? "Votre profil";
	const requirementText = currentRequirements
		.map((req) => `${Math.min(req.current, req.required)} sur ${req.required} ${req.label}`)
		.join(", ");

	return {
		title: "Pass",
		profileImageUrl,
		userName,
		currentLevel: currentLevelVm,
		rings,
		completedRings: rings.filter((ring) => ring.status === "completed"),
		counters: {
			tickets: counters.validatedTickets,
			comments: counters.publishedComments,
			likes: counters.confirmedLikes,
		},
		nextUnlock,
		accessibilityLabel: `${currentLevelVm.label}, progression ${currentLevelVm.progressPercent} %. ${requirementText}`,
	};
};
