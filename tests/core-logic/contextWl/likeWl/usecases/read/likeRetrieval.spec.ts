import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { likesRetrieval } from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";
import {FakeLikesGateway} from "@/tests/core-logic/fakes/FakeLikesGateway";


describe("Likes retrieval", () => {
    let store: ReduxStoreWl;
    let likes: FakeLikesGateway;

    beforeEach(() => {
        likes = new FakeLikesGateway();
        store = initReduxStoreWl({
            dependencies: { gateways: { likes } as any },
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
        expect(agg.error).toBeUndefined();
    });

    it("error: set loading=error + message", async () => {
        likes.willFailGet = true;
        likes.failMessage = "likes get failed";

        await store.dispatch(likesRetrieval({ targetId: "cafe_A" }) as any);

        const agg = store.getState().lState.byTarget["cafe_A"];
        expect(agg.loading).toBe("error");
        expect(agg.error).toBe("likes get failed");
    });

    it("inflight abort: second call wins, first result ignored", async () => {
        // On simule une première requête qui ne résout pas tout de suite
        let resolveFirst!: (v: any) => void;
        const firstPromise = new Promise<any>((r) => (resolveFirst = r));

        const originalGet = likes.get.bind(likes);
        let callIndex = 0;

        likes.get = async ({ targetId, signal }: { targetId: string; signal: AbortSignal }) => {
            callIndex += 1;

            if (callIndex === 1) {
                // première requête: attend, mais si abort -> AbortError
                if (signal.aborted) {
                    const e: any = new Error("Aborted");
                    e.name = "AbortError";
                    throw e;
                }
                const res = await firstPromise;
                if (signal.aborted) {
                    const e: any = new Error("Aborted");
                    e.name = "AbortError";
                    throw e;
                }
                return res;
            }

            // seconde requête répond immédiatement
            return originalGet({ targetId, signal });
        };

        // 1) première call (pending)
        const p1 = store.dispatch(likesRetrieval({ targetId: "cafe_A" }) as any);

        // 2) configure la réponse de la seconde call et déclenche la seconde
        likes.nextGetResponse = { count: 2, me: false, version: 2, serverTime: "t2" };
        const p2 = store.dispatch(likesRetrieval({ targetId: "cafe_A" }) as any);

        // 3) maintenant, on résout la première avec une autre valeur : elle doit être ignorée
        resolveFirst({ count: 999, me: true, version: 999, serverTime: "t1" });

        await Promise.all([p1, p2]);

        const agg = store.getState().lState.byTarget["cafe_A"];
        expect(agg.count).toBe(2);
        expect(agg.me).toBe(false);
        expect(agg.version).toBe(2);
        expect(agg.updatedAt).toBe("t2");
        expect(agg.loading).toBe("success");
    });
});
