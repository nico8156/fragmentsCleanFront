import { useMemo } from "react";
import { useSelector } from "react-redux";

import {
	selectCurrentUser,
	selectUserSocialStats
} from "@/app/core-logic/contextWL/userWl/selector/user.selector";

import {
	BADGE_DEFINITIONS,
	computeBadgeCompletion,
	getDefaultBadgeProgress,
} from "@/app/core-logic/contextWL/userWl/badges/badges";

import { selectVisitedCafesCount } from "@/app/core-logic/contextWL/locationWl/selector/location.selector";
import { selectSortedTickets } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";
import { BadgeProgress } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

type BadgeStatus = "unlocked" | "in_progress" | "locked";

export type DecoratedBadge = (typeof BADGE_DEFINITIONS)[number] & {
	completion: number;
	currentSteps: number;
	totalRequired: number;
	remainingSteps: number;
	status: BadgeStatus;
};

export type RewardsViewModel = {
	progress: BadgeProgress;

	confirmedTickets: number;
	pendingTicketsCount: number;

	badges: DecoratedBadge[];
	badgesById: Record<string, DecoratedBadge>;

	unlockedCount: number;
	isEmpty: boolean;

	commentCount: number;
	likeCount: number;
	visitedCafesCount: number;

	lastTicket: TicketAggregate | null;
};

export function useRewardsViewModel(): RewardsViewModel {
	const user = useSelector(selectCurrentUser);
	const tickets = useSelector(selectSortedTickets);
	const { commentCount, likeCount } = useSelector(selectUserSocialStats);
	const visitedCafesCount = useSelector(selectVisitedCafesCount);

	const progress: BadgeProgress =
		user?.preferences?.badgeProgress ?? getDefaultBadgeProgress();

	/* -------------------------------------------------------------------------- */
	/*                               TICKETS STATS                                */
	/* -------------------------------------------------------------------------- */

	const confirmedTickets = useMemo(
		() => tickets.filter((t) => t.status === "CONFIRMED").length,
		[tickets]
	);

	const pendingTicketsCount = useMemo(
		() =>
			tickets.filter(
				(t) =>
					t.optimistic ||
					t.status === "CAPTURED" ||
					t.status === "ANALYZING"
			).length,
		[tickets]
	);

	const lastTicket = tickets[0] ?? null;

	/* -------------------------------------------------------------------------- */
	/*                               BADGES COMPUTE                               */
	/* -------------------------------------------------------------------------- */

	const badges: DecoratedBadge[] = useMemo(() => {
		const computed = BADGE_DEFINITIONS.map((badge) => {
			const completion = computeBadgeCompletion(progress, badge);

			const totalRequired =
				badge.requirements.exploration +
				badge.requirements.gout +
				badge.requirements.social || 1;

			const currentSteps =
				Math.min(progress.exploration, badge.requirements.exploration) +
				Math.min(progress.gout, badge.requirements.gout) +
				Math.min(progress.social, badge.requirements.social);

			const remainingSteps = Math.max(0, totalRequired - currentSteps);

			const status: BadgeStatus =
				progress.unlockedBadges.includes(badge.id)
					? "unlocked"
					: completion > 0
						? "in_progress"
						: "locked";

			return {
				...badge,
				completion: clamp(completion),
				currentSteps,
				totalRequired,
				remainingSteps,
				status,
			};
		});

		/* ------------------------------- SMART SORT ------------------------------ */

		return computed.sort((a, b) => {
			const statusRank = (s: BadgeStatus) =>
				s === "in_progress" ? 0 : s === "locked" ? 1 : 2;

			const sr = statusRank(a.status) - statusRank(b.status);
			if (sr !== 0) return sr;

			// in_progress: most advanced first
			if (a.status === "in_progress" && b.status === "in_progress") {
				const c = b.completion - a.completion;
				if (c !== 0) return c;
			}

			// locked: easiest first
			if (a.status === "locked" && b.status === "locked") {
				const e = a.totalRequired - b.totalRequired;
				if (e !== 0) return e;
			}

			return 0;
		});
	}, [progress]);

	const badgesById = useMemo(() => {
		return badges.reduce<Record<string, DecoratedBadge>>((acc, b) => {
			acc[b.id] = b;
			return acc;
		}, {});
	}, [badges]);

	const unlockedCount = useMemo(
		() => badges.filter((b) => b.status === "unlocked").length,
		[badges]
	);

	return {
		progress,

		confirmedTickets,
		pendingTicketsCount,

		badges,
		badgesById,

		unlockedCount,
		isEmpty: badges.length === 0,

		commentCount,
		likeCount,
		visitedCafesCount,

		lastTicket,
	};
}
