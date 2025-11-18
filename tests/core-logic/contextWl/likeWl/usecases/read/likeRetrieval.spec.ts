// likeWl/usecases/read/likesRetrieval.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {FakeLikesGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {likesRetrieval} from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";

describe("Likes retrieval", () => {
    let store: ReduxStoreWl;
    let likes: FakeLikesGateway;

    beforeEach(() => {
        likes = new FakeLikesGateway();
        store = initReduxStoreWl({
            dependencies: { gateways: { likes } },
        });
    });

    it("happy path: set count/me/version and success", async () => {
        likes.nextGetResponse = {
            count: 12,
            me: true,
            version: 3,
            serverTime: "2025-10-10T07:01:00.000Z",
        };
        await store.dispatch(likesRetrieval({ targetId: "cafe_A" }) as any);

        const agg = store.getState().lState.byTarget["cafe_A"];
        expect(agg).toBeDefined();
        expect(agg.count).toBe(12);
        expect(agg.me).toBe(true);
        expect(agg.version).toBe(3);
        expect(agg.updatedAt).toBe("2025-10-10T07:01:00.000Z");
        expect(agg.loading).toBe("success");
    });

    it("error: set loading=error + message", async () => {
        likes.willFailGet = true;
        await store.dispatch(likesRetrieval({ targetId: "cafe_A" }) as any);
        const agg = store.getState().lState.byTarget["cafe_A"];
        expect(agg.loading).toBe("error");
        expect(agg.error).toBe("likes get failed");
    });
});
