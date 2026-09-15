import { rollbackRejectedOutboxRecord } from "@/app/core-logic/contextWL/outboxWl/commandHandlers/outboxCommandHandlers";
import { commandKinds, statusTypes, type OutboxRecord } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

const record = (kind: typeof commandKinds.UserAvatarAttach | typeof commandKinds.ExperienceMediaAttach): OutboxRecord => ({
	id: "outbox-1",
	status: statusTypes.awaitingAck,
	attempts: 1,
	enqueuedAt: "2026-09-14T10:00:00Z",
	item: {
		command: {
			kind,
			commandId: "command-1",
			mediaId: "media-1",
			experienceId: "experience-1",
			image: { localUri: "file:///documents/pending-private-media/photo.jpg", contentType: "image/jpeg", size: 42 },
			at: "2026-09-14T10:00:00Z",
		} as any,
		undo: { kind, experienceId: "experience-1", version: 1 } as any,
	},
});

describe("private media terminal rollback", () => {
	it.each([commandKinds.UserAvatarAttach, commandKinds.ExperienceMediaAttach])("discards %s local payload only after explicit rejection", (kind) => {
		const discard = jest.fn();

		rollbackRejectedOutboxRecord({
			record: record(kind),
			dispatch: jest.fn() as any,
			gateways: { localPrivateMedia: { discard } },
		});

		expect(discard).toHaveBeenCalledWith("file:///documents/pending-private-media/photo.jpg");
	});
});
