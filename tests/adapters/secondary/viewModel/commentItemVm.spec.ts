import {
	buildCommentItemVM,
	formatRelativeTime,
	toCommentTransportStatus,
} from "@/app/adapters/secondary/viewModel/commentItemVm";
import { statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { moderationTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

describe("commentItemVm", () => {
	it("formats relative time from an explicit clock", () => {
		const now = Date.parse("2026-07-16T12:00:00.000Z");

		expect(formatRelativeTime("2026-07-16T11:59:40.000Z", now)).toBe("À l'instant");
		expect(formatRelativeTime("2026-07-16T11:40:00.000Z", now)).toBe("Il y a 20 min");
		expect(formatRelativeTime("2026-07-16T09:00:00.000Z", now)).toBe("Il y a 3 h");
	});

	it("derives transport status from outbox status", () => {
		expect(toCommentTransportStatus(statusTypes.failed)).toBe("failed");
		expect(toCommentTransportStatus(statusTypes.queued)).toBe("pending");
		expect(toCommentTransportStatus(statusTypes.awaitingAck)).toBe("pending");
		expect(toCommentTransportStatus(undefined)).toBe("success");
	});

	it("builds a UI item with current-user fallback identity", () => {
		const item = buildCommentItemVM({
			comment: {
				id: "comment_1",
				targetId: "coffee_1",
				authorId: "user_1",
				body: "Bonjour",
				createdAt: "2026-07-16T11:59:40.000Z",
				version: 1,
				moderation: moderationTypes.PUBLISHED,
			} as any,
			currentUser: { displayName: "Nicolas", avatarUrl: null },
			effectiveUserId: "user_1",
			outboxStatus: statusTypes.queued,
			showPendingFeedback: true,
			nowMs: Date.parse("2026-07-16T12:00:00.000Z"),
		});

		expect(item).toMatchObject({
			id: "comment_1",
			authorName: "Nicolas",
			body: "Bonjour",
			transportStatus: "pending",
			showPendingFeedback: true,
			isAuthor: true,
		});
	});
});
