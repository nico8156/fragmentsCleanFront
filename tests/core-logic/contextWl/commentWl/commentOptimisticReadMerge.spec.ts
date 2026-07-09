import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import {
	addOptimisticCreated,
	deleteOptimisticApplied,
	updateOptimisticApplied,
} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { commentsRetrieved } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

const targetId = "cafe_A";
const commentId = "comment_1";

const seedComment = {
	id: commentId,
	targetId,
	body: "old body",
	authorId: "user_1",
	createdAt: "2026-01-01T10:00:00.000Z",
	likeCount: 0,
	replyCount: 0,
	moderation: "PUBLISHED",
	version: 7,
	optimistic: false,
} as any;

describe("comment read merge while write is optimistic", () => {
	it("keeps an optimistic update when a stale read returns the previous body", () => {
		const store = initReduxStoreWl({});

		store.dispatch(addOptimisticCreated({ entity: seedComment }));
		store.dispatch(updateOptimisticApplied({
			commentId,
			newBody: "local edited body",
			clientEditedAt: "2026-01-01T10:01:00.000Z",
		}));

		store.dispatch(commentsRetrieved({
			targetId,
			op: opTypes.REFRESH,
			items: [seedComment],
			serverTime: "2026-01-01T10:02:00.000Z",
		}));

		const entity = (store.getState() as any).cState.entities.entities[commentId];
		expect(entity.body).toBe("local edited body");
		expect(entity.optimistic).toBe(true);
	});

	it("keeps an optimistic delete when a stale read still contains the comment", () => {
		const store = initReduxStoreWl({});

		store.dispatch(addOptimisticCreated({ entity: seedComment }));
		store.dispatch(deleteOptimisticApplied({
			commentId,
			clientDeletedAt: "2026-01-01T10:01:00.000Z",
		}));

		store.dispatch(commentsRetrieved({
			targetId,
			op: opTypes.REFRESH,
			items: [seedComment],
			serverTime: "2026-01-01T10:02:00.000Z",
		}));

		const entity = (store.getState() as any).cState.entities.entities[commentId];
		expect(entity.deletedAt).toBe("2026-01-01T10:01:00.000Z");
		expect(entity.moderation).toBe("SOFT_DELETED");
		expect(entity.optimistic).toBe(true);
	});

	it("accepts a newer server version and clears the local optimistic flag", () => {
		const store = initReduxStoreWl({});

		store.dispatch(addOptimisticCreated({ entity: seedComment }));
		store.dispatch(updateOptimisticApplied({
			commentId,
			newBody: "local edited body",
			clientEditedAt: "2026-01-01T10:01:00.000Z",
		}));

		store.dispatch(commentsRetrieved({
			targetId,
			op: opTypes.REFRESH,
			items: [{
				...seedComment,
				body: "server edited body",
				editedAt: "2026-01-01T10:02:00.000Z",
				version: 8,
			}],
			serverTime: "2026-01-01T10:02:00.000Z",
		}));

		const entity = (store.getState() as any).cState.entities.entities[commentId];
		expect(entity.body).toBe("server edited body");
		expect(entity.version).toBe(8);
		expect(entity.optimistic).toBe(false);
	});
});
