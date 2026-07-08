type CommentSyncVM = { state: "pending" | "acked" | "failed"; untilMs: number } | null;

type ComputeCommentSyncInput = {
	pendingCount: number;
	failedCount: number;
	prevPendingCount: number;
	hasSeenInitialPending: boolean;
	hasLocalPendingCycle: boolean;
	nowMs: number;
};

export type CommentSyncDecision = {
	sync: CommentSyncVM;
	nextPrevPendingCount: number;
	nextHasSeenInitialPending: boolean;
	nextHasLocalPendingCycle: boolean;
};

export const computeCommentSyncDecision = ({
	pendingCount,
	failedCount,
	prevPendingCount,
	hasSeenInitialPending,
	hasLocalPendingCycle,
	nowMs,
}: ComputeCommentSyncInput): CommentSyncDecision => {
	if (!hasSeenInitialPending) {
		return {
			sync: null,
			nextPrevPendingCount: pendingCount,
			nextHasSeenInitialPending: true,
			nextHasLocalPendingCycle: false,
		};
	}

	if (pendingCount > prevPendingCount) {
		return {
			sync: { state: "pending", untilMs: nowMs + 10_000 },
			nextPrevPendingCount: pendingCount,
			nextHasSeenInitialPending: true,
			nextHasLocalPendingCycle: true,
		};
	}

	if (hasLocalPendingCycle && prevPendingCount > 0 && pendingCount === 0 && failedCount === 0) {
		return {
			sync: { state: "acked", untilMs: nowMs + 900 },
			nextPrevPendingCount: 0,
			nextHasSeenInitialPending: true,
			nextHasLocalPendingCycle: false,
		};
	}

	if (hasLocalPendingCycle && failedCount > 0) {
		return {
			sync: { state: "failed", untilMs: nowMs + 1500 },
			nextPrevPendingCount: pendingCount,
			nextHasSeenInitialPending: true,
			nextHasLocalPendingCycle: false,
		};
	}

	return {
		sync: null,
		nextPrevPendingCount: pendingCount,
		nextHasSeenInitialPending: true,
		nextHasLocalPendingCycle: hasLocalPendingCycle,
	};
};

export const computeLocalPendingFeedbackIds = ({
	pendingIds,
	pendingIdsAtEntry,
	currentLocalIds,
}: {
	pendingIds: string[];
	pendingIdsAtEntry: Set<string>;
	currentLocalIds: Set<string>;
}): Set<string> => {
	const pending = new Set(pendingIds);
	const next = new Set<string>();

	for (const id of pending) {
		if (pendingIdsAtEntry.has(id)) continue;
		next.add(id);
	}

	for (const id of currentLocalIds) {
		if (pending.has(id) && !pendingIdsAtEntry.has(id)) {
			next.add(id);
		}
	}

	return next;
};
