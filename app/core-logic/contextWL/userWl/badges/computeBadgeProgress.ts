import { BadgeProgress } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import { computeUnlockedBadges, getDefaultBadgeProgress } from "./badges";

const unique = <T>(items: T[]) => Array.from(new Set(items));

export const computeBadgeProgressFromState = (state: RootStateWl): BadgeProgress => {
    const currentUser = state.aState.currentUser;
    const base = currentUser?.preferences?.badgeProgress ?? getDefaultBadgeProgress();

    const confirmedTickets = Object.values(state.tState.byId).filter((ticket) => ticket.status === "CONFIRMED");
    const exploration = unique(
        confirmedTickets.map((ticket) => ticket.merchantName?.trim()).filter(Boolean) as string[],
    ).length;

    const gout = confirmedTickets.length;

    const commentCount = Object.values(state.cState.entities.entities).filter(
        (comment) => comment?.authorId === currentUser?.id,
    ).length;
    const likedTargets = Object.values(state.lState.byTarget).filter((agg) => agg.me).length;
    const social = commentCount + likedTargets;

    const nextProgress: BadgeProgress = {
        exploration,
        gout,
        social,
        unlockedBadges: base.unlockedBadges,
    };

    nextProgress.unlockedBadges = computeUnlockedBadges(nextProgress);

    return nextProgress;
};
