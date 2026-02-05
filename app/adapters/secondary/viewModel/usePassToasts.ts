import { useRewardsViewModel } from "@/app/adapters/secondary/viewModel/useRewardsVM";
import { useEffect, useRef } from "react";

type ToastFn = (message: string) => void;

export function usePassToasts(onToast: ToastFn) {
	const vm = useRewardsViewModel();

	const prevConfirmed = useRef(vm.confirmedTickets);
	const prevPending = useRef(vm.pendingTicketsCount);
	const prevUnlocked = useRef(new Set(vm.progress.unlockedBadges));

	useEffect(() => {
		// Ticket confirmed (reliable signal: confirmed increases)
		if (vm.confirmedTickets > prevConfirmed.current) {
			onToast("Ticket confirmé ✅");
		}

		// Ticket rejected (best effort: pending decreases but confirmed doesn't)
		// Optional: you can make it smarter by checking lastTicket.status === REJECTED
		if (
			vm.pendingTicketsCount < prevPending.current &&
			vm.confirmedTickets === prevConfirmed.current &&
			vm.lastTicket?.status === "REJECTED"
		) {
			onToast("Ticket rejeté ❌");
		}

		prevConfirmed.current = vm.confirmedTickets;
		prevPending.current = vm.pendingTicketsCount;
	}, [vm.confirmedTickets, vm.pendingTicketsCount, vm.lastTicket?.status, onToast]);

	useEffect(() => {
		const current = new Set(vm.progress.unlockedBadges);
		const newlyUnlocked = [...current].filter((id) => !prevUnlocked.current.has(id));

		newlyUnlocked.forEach((id) => {
			const label = vm.badgesById[id]?.label ?? "Badge";
			onToast(`Badge débloqué : ${label} 🎉`);
		});

		prevUnlocked.current = current;
	}, [vm.progress.unlockedBadges, vm.badgesById, onToast]);
}

