import {
	selectOutboxStatusByCommentId,
	selectOutboxStatusByTicketId,
	selectPendingLikeCommandKindForTarget,
} from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import {
	commandKinds,
	statusTypes,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

const rootWithOutbox = (oState: any) => ({ oState }) as any;

describe("outbox transport selectors", () => {
	it("exposes pending like command kind for a target", () => {
		const state = rootWithOutbox({
			byId: {
				obx_1: {
					id: "obx_1",
					status: statusTypes.awaitingAck,
					attempts: 1,
					enqueuedAt: "2026-01-01T00:00:00.000Z",
					item: {
						command: {
							kind: commandKinds.LikeAdd,
							commandId: "cmd_1",
							targetId: "coffee_1",
							at: "2026-01-01T00:00:00.000Z",
						},
						undo: {
							kind: commandKinds.LikeAdd,
							targetId: "coffee_1",
							prevCount: 0,
							prevMe: false,
						},
					},
				},
			},
			queue: [],
			byCommandId: { cmd_1: "obx_1" },
			suspended: false,
		});

		expect(selectPendingLikeCommandKindForTarget("coffee_1")(state)).toBe(commandKinds.LikeAdd);
		expect(selectPendingLikeCommandKindForTarget("coffee_2")(state)).toBeNull();
	});

	it("indexes comment and ticket transport statuses", () => {
		const state = rootWithOutbox({
			byId: {
				obx_comment: {
					id: "obx_comment",
					status: statusTypes.processing,
					attempts: 1,
					enqueuedAt: "2026-01-01T00:00:00.000Z",
					item: {
						command: {
							kind: commandKinds.CommentCreate,
							commandId: "cmd_comment",
							tempId: "comment_tmp",
							targetId: "coffee_1",
							body: "Hello",
							at: "2026-01-01T00:00:00.000Z",
						},
						undo: {
							kind: commandKinds.CommentCreate,
							tempId: "comment_tmp",
							targetId: "coffee_1",
						},
					},
				},
				obx_ticket: {
					id: "obx_ticket",
					status: statusTypes.awaitingAck,
					attempts: 1,
					enqueuedAt: "2026-01-01T00:00:00.000Z",
					item: {
						command: {
							kind: commandKinds.TicketVerify,
							commandId: "cmd_ticket",
							ticketId: "ticket_1",
							at: "2026-01-01T00:00:00.000Z",
						},
						undo: {
							kind: commandKinds.TicketVerify,
							ticketId: "ticket_1",
						},
					},
				},
			},
			queue: [],
			byCommandId: {
				cmd_comment: "obx_comment",
				cmd_ticket: "obx_ticket",
			},
			suspended: false,
		});

		expect(selectOutboxStatusByCommentId(state).comment_tmp).toBe(statusTypes.processing);
		expect(selectOutboxStatusByTicketId(state).ticket_1).toBe(statusTypes.awaitingAck);
	});
});
