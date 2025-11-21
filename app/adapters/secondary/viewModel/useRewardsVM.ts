// useRewardsViewModel.ts
import { useMemo } from "react";
import { useSelector } from "react-redux";

import { selectCurrentUser } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import {
    BADGE_DEFINITIONS,
    computeBadgeCompletion,
    getDefaultBadgeProgress,
} from "@/app/core-logic/contextWL/userWl/badges/badges";
import { BadgeProgress } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { selectSortedTickets } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

type BadgeStatus = "unlocked" | "in_progress" | "locked";

export type DecoratedBadge = (typeof BADGE_DEFINITIONS)[number] & {
    completion: number;
    currentSteps: number;
    totalRequired: number;
    status: BadgeStatus;
};

export type RewardsViewModel = {
    progress: BadgeProgress;
    confirmedTickets: number;
    badges: DecoratedBadge[];
    unlockedCount: number;
    isEmpty: boolean;
};

export function useRewardsViewModel(): RewardsViewModel {
    const user = useSelector(selectCurrentUser);
    const tickets = useSelector(selectSortedTickets);

    const progress: BadgeProgress = user?.preferences?.badgeProgress ?? getDefaultBadgeProgress();

    const confirmedTickets = useMemo(
        () => tickets.filter((ticket) => ticket.status === "CONFIRMED").length,
        [tickets],
    );

    const badges: DecoratedBadge[] = useMemo(
        () =>
            BADGE_DEFINITIONS.map((badge) => {
                const completion = computeBadgeCompletion(progress, badge);
                const totalRequired =
                    badge.requirements.exploration +
                    badge.requirements.gout +
                    badge.requirements.social || 1;

                const currentSteps =
                    Math.min(progress.exploration, badge.requirements.exploration) +
                    Math.min(progress.gout, badge.requirements.gout) +
                    Math.min(progress.social, badge.requirements.social);

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
                    status,
                };
            }),
        [progress],
    );

    const unlockedCount = useMemo(
        () => badges.filter((b) => b.status === "unlocked").length,
        [badges],
    );

    return {
        progress,
        confirmedTickets,
        badges,
        unlockedCount,
        isEmpty: badges.length === 0,
    };
}
