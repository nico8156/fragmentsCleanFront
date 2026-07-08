import {
	computeCommentSyncDecision,
	computeLocalPendingFeedbackIds,
} from "@/app/adapters/secondary/viewModel/commentSyncVm";

describe("comment sync VM", () => {
	it("does not show a pending witness for commands that were already pending on mount", () => {
		const decision = computeCommentSyncDecision({
			pendingCount: 1,
			failedCount: 0,
			prevPendingCount: 0,
			hasSeenInitialPending: false,
			hasLocalPendingCycle: false,
			nowMs: 1000,
		});

		expect(decision.sync).toBeNull();
		expect(decision.nextPrevPendingCount).toBe(1);
		expect(decision.nextHasSeenInitialPending).toBe(true);
		expect(decision.nextHasLocalPendingCycle).toBe(false);
	});

	it("shows pending only when pending count increases after mount", () => {
		const decision = computeCommentSyncDecision({
			pendingCount: 2,
			failedCount: 0,
			prevPendingCount: 1,
			hasSeenInitialPending: true,
			hasLocalPendingCycle: false,
			nowMs: 1000,
		});

		expect(decision.sync).toEqual({ state: "pending", untilMs: 11_000 });
		expect(decision.nextPrevPendingCount).toBe(2);
		expect(decision.nextHasLocalPendingCycle).toBe(true);
	});

	it("shows acked after a local pending command reaches success", () => {
		const decision = computeCommentSyncDecision({
			pendingCount: 0,
			failedCount: 0,
			prevPendingCount: 1,
			hasSeenInitialPending: true,
			hasLocalPendingCycle: true,
			nowMs: 1000,
		});

		expect(decision.sync).toEqual({ state: "acked", untilMs: 1900 });
		expect(decision.nextPrevPendingCount).toBe(0);
		expect(decision.nextHasLocalPendingCycle).toBe(false);
	});

	it("does not show acked when a command that was already pending on mount completes", () => {
		const decision = computeCommentSyncDecision({
			pendingCount: 0,
			failedCount: 0,
			prevPendingCount: 1,
			hasSeenInitialPending: true,
			hasLocalPendingCycle: false,
			nowMs: 1000,
		});

		expect(decision.sync).toBeNull();
		expect(decision.nextPrevPendingCount).toBe(0);
		expect(decision.nextHasLocalPendingCycle).toBe(false);
	});

	it("marks only pending comments created after entry for Envoi feedback", () => {
		const atEntry = new Set(["already_pending"]);
		const first = computeLocalPendingFeedbackIds({
			pendingIds: ["already_pending"],
			pendingIdsAtEntry: atEntry,
			currentLocalIds: new Set(),
		});
		expect([...first]).toEqual([]);

		const afterSend = computeLocalPendingFeedbackIds({
			pendingIds: ["already_pending", "new_pending"],
			pendingIdsAtEntry: atEntry,
			currentLocalIds: first,
		});
		expect([...afterSend]).toEqual(["new_pending"]);

		const afterAck = computeLocalPendingFeedbackIds({
			pendingIds: ["already_pending"],
			pendingIdsAtEntry: atEntry,
			currentLocalIds: afterSend,
		});
		expect([...afterAck]).toEqual([]);
	});
});
