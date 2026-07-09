import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import {
	likeOptimisticApplied,
	likesRetrieved,
	unlikeOptimisticApplied,
} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";

const targetId = "cafe_A";

describe("like optimistic read merge", () => {
	it("keeps a local like intent when a newer target read still says me=false", () => {
		const store = initReduxStoreWl({});

		store.dispatch(likesRetrieved({
			targetId,
			count: 10,
			me: false,
			version: 4,
			serverTime: "2026-01-01T10:00:00.000Z",
		}));
		store.dispatch(likeOptimisticApplied({
			targetId,
			clientAt: "2026-01-01T10:01:00.000Z",
			commandId: "cmd_like",
		}));
		store.dispatch(likesRetrieved({
			targetId,
			count: 11,
			me: false,
			version: 5,
			serverTime: "2026-01-01T10:02:00.000Z",
		}));

		const like = (store.getState() as any).lState.byTarget[targetId];
		expect(like.me).toBe(true);
		expect(like.count).toBe(12);
		expect(like.optimistic).toBe(true);
	});

	it("keeps a local unlike intent when a newer target read still says me=true", () => {
		const store = initReduxStoreWl({});

		store.dispatch(likesRetrieved({
			targetId,
			count: 10,
			me: true,
			version: 4,
			serverTime: "2026-01-01T10:00:00.000Z",
		}));
		store.dispatch(unlikeOptimisticApplied({
			targetId,
			clientAt: "2026-01-01T10:01:00.000Z",
			commandId: "cmd_unlike",
		}));
		store.dispatch(likesRetrieved({
			targetId,
			count: 11,
			me: true,
			version: 5,
			serverTime: "2026-01-01T10:02:00.000Z",
		}));

		const like = (store.getState() as any).lState.byTarget[targetId];
		expect(like.me).toBe(false);
		expect(like.count).toBe(10);
		expect(like.optimistic).toBe(true);
	});
});
