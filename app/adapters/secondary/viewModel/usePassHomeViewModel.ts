import { DecoratedBadge, useRewardsViewModel } from "@/app/adapters/secondary/viewModel/useRewardsVM";
import { useMemo } from "react";

export type PassPrimaryAction =
	| { type: "scan_ticket"; label: string }
	| { type: "none"; label: string };

export type PassNextGoal = {
	badgeId: string;
	title: string;
	description: string;
	progressLabel: string;
};

export type PassHomeViewModel = {
	statusLine: string;

	primaryAction: PassPrimaryAction;

	nextGoal: PassNextGoal | null;

	badgesPreview: DecoratedBadge[];
	showAllBadgesCta: boolean;

	// useful for UI (optional)
	pendingTicketsCount: number;
	confirmedTickets: number;
};

function pickNextGoalBadge(badges: DecoratedBadge[]): DecoratedBadge | null {
	// 1) Force Coffee Taster as onboarding goal if not unlocked
	const coffeeTaster = badges.find((b) => b.id === "coffee_taster");
	if (coffeeTaster && coffeeTaster.status !== "unlocked") return coffeeTaster;

	// 2) Otherwise: best in_progress (highest completion)
	const inProgress = badges
		.filter((b) => b.status === "in_progress")
		.sort((a, b) => b.completion - a.completion)[0];
	if (inProgress) return inProgress;

	// 3) Otherwise: easiest locked
	const locked = badges
		.filter((b) => b.status === "locked")
		.sort((a, b) => a.totalRequired - b.totalRequired)[0];
	if (locked) return locked;

	return null;
}

export function usePassHomeViewModel(): PassHomeViewModel {
	const rewards = useRewardsViewModel();

	const nextGoalBadge = useMemo(
		() => pickNextGoalBadge(rewards.badges),
		[rewards.badges]
	);

	const statusLine = useMemo(() => {
		if (rewards.pendingTicketsCount > 0) {
			return `${rewards.pendingTicketsCount} ticket(s) en cours de vérification…`;
		}

		if (rewards.unlockedCount === 0) {
			return "Valide ton premier ticket pour lancer ta progression ☕️";
		}

		return `Tu as débloqué ${rewards.unlockedCount} badge(s).`;
	}, [rewards.pendingTicketsCount, rewards.unlockedCount]);

	const primaryAction: PassPrimaryAction = useMemo(() => {
		// For now: always scan ticket (your main mechanic)
		return { type: "scan_ticket", label: "Scanner un ticket" };
	}, []);

	const nextGoal: PassNextGoal | null = useMemo(() => {
		if (!nextGoalBadge) return null;

		const remaining = nextGoalBadge.remainingSteps;

		const progressLabel =
			nextGoalBadge.status === "unlocked"
				? "Débloqué ✅"
				: remaining <= 0
					? "Presque !"
					: `Encore ${remaining} action(s)`;

		return {
			badgeId: nextGoalBadge.id,
			title: `Prochain badge : ${nextGoalBadge.label}`,
			description: nextGoalBadge.description,
			progressLabel,
		};
	}, [nextGoalBadge]);

	const badgesPreview = useMemo(() => {
		// Show only locked + in_progress (hide unlocked on home)
		return rewards.badges
			.filter((b) => b.status !== "unlocked")
			.slice(0, 3);
	}, [rewards.badges]);

	return {
		statusLine,
		primaryAction,
		nextGoal,
		badgesPreview,
		showAllBadgesCta: rewards.badges.length > 3,
		pendingTicketsCount: rewards.pendingTicketsCount,
		confirmedTickets: rewards.confirmedTickets,
	};
}
