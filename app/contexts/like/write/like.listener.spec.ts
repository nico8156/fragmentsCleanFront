// like.listener.spec.ts
import { FakeLikeGateway } from "@/app/adapters/secondary/gateways/fake/fakeLikeGateway";
import {
    likeSetRequested,
    likeOptimisticApplied,
    likeEnqueued,
    likeConfirmed,
    startLikeProcessing,
    onCoffeeLikeRequestedFactory,
} from "@/app/contexts/like/write/like.listener";
import type { AnyAction, Middleware } from "@reduxjs/toolkit";
import { initReduxStore, ReduxStore } from "@/app/store/reduxStore";
// 👈

describe("On coffee like requested", () => {
    let store: ReduxStore;
    let likeGateway: FakeLikeGateway;


    const actions: AnyAction[] = [];
    const captureMw = makeCaptureMiddleware(actions); // 👈

    beforeEach(() => {
        likeGateway = new FakeLikeGateway();
        jest.spyOn(likeGateway, "set").mockResolvedValue({ count: 42 });
        capturedActions.length = 0;
    });

    it("met en file puis draine la file (outboxQueue revient à [])", async () => {
        store = initReduxStore({
            listeners: [onCoffeeLikeRequestedFactory({ likeGateway }).middleware],
        });

        // 1) Dispatch
        store.dispatch(likeSetRequested({ targetId: "t1", liked: true }));

        // 2) Attendre qu’un item apparaisse (mise en file)
        await waitForState(
            () => store.getState().outboxQueue,
            (q) => Array.isArray(q) && q.length >= 1
        );

        // 3) Attendre la vidange de la file (traitement effectué)
        await waitForState(
            () => store.getState().outboxQueue,
            (q) => Array.isArray(q) && q.length === 0
        );

        // 4) Sanity check: le gateway a bien été appelé (effet observé)
        expect(likeGateway.set).toHaveBeenCalledWith(
            expect.objectContaining({ targetId: "t1", liked: true, commandId: expect.any(String) })
        );
    });
    it("retry: ECONNRESET conserve l'item et incrémente attempts", async () => {
        const likeGateway = new FakeLikeGateway();
        jest.spyOn(likeGateway, "set").mockRejectedValue(new Error("ECONNRESET"));

        const store = initReduxStore({
            listeners: [onCoffeeLikeRequestedFactory({ likeGateway }).middleware],
        });

        store.dispatch(likeSetRequested({ targetId: "t1", liked: true }));

        // attendre qu’un item soit présent
        await waitForState(
            () => store.getState().outboxQueue,
            (q) => Array.isArray(q) && q.length === 1
        );

        // attendre que le listener ait bumpé l'item (attempts >= 1)
        await waitForState(
            () => store.getState().outboxQueue[0],
            (cmd) => !!cmd && cmd.attempts >= 1
        );

        const cmd = store.getState().outboxQueue[0];
        expect(cmd.attempts).toBeGreaterThanOrEqual(1);
    });
    it("non-retryable: 400 retire l'item de la file (rollback effectué)", async () => {
        const likeGateway = new FakeLikeGateway();
        jest.spyOn(likeGateway, "set").mockRejectedValue(new Error("400 Bad Request"));

        const store = initReduxStore({
            listeners: [onCoffeeLikeRequestedFactory({ likeGateway }).middleware],
        });

        store.dispatch(likeSetRequested({ targetId: "t1", liked: true }));

        // item en file
        await waitForState(
            () => store.getState().outboxQueue,
            (q) => Array.isArray(q) && q.length === 1
        );

        // après traitement, l'item doit disparaître (échec non-retry → remove)
        await waitForState(
            () => store.getState().outboxQueue,
            (q) => Array.isArray(q) && q.length === 0
        );

        // (optionnel) si ton slice "likes" gère le revert, vérifie l'état ici avec ton sélecteur
        // expect(selectLike(store.getState(), "t1").liked).toBe(false) // exemple
    });


    it("optimistic + enqueue + gateway.set + confirmed", () => {
        return new Promise((resolve, reject) => {
            store = initReduxStore({
                // `gateways` non utilisé si ton listener ferme sur deps, ok d'y laisser
                gateways: { likeGateway },
                listeners: [
                    captureMw, // 👈 d’abord le capteur
                    onCoffeeLikeRequestedFactory(
                        { likeGateway },
                        () => {              // callback appelé après likeConfirmed (cf. patch listener)
                            try {
                                expect(actions.some(a => a.type === likeOptimisticApplied.type)).toBe(true);
                                expect(actions.some(a => a.type === likeEnqueued.type)).toBe(true);
                                expect(actions.some(a => a.type === startLikeProcessing.type)).toBe(true);
                                expect(actions.some(a => a.type === likeConfirmed.type)).toBe(true);
                                resolve({});
                            } catch (e) { reject(e); }
                        }
                    ).middleware,          // 👈 puis ton listener
                ],
            });

            // déclenchement
            store.dispatch(likeSetRequested({ targetId: "t1", liked: true }));
        });


});

    // helpers
    const capturedActions: AnyAction[] = [];
    const spyDispatch = (s: ReduxStore) => {
        const orig = s.dispatch;
        // @ts-expect-error override for test
        s.dispatch = (a: AnyAction) => {
            capturedActions.push(a);
            return orig(a);
        };
    };
    function makeCaptureMiddleware(bucket: AnyAction[]): Middleware {
        return () => (next) => (action: any) => { bucket.push(action); return next(action); };
    }

    const createOnLikeSetRequestedListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (value: unknown) => void
    ): Middleware => {
        return onCoffeeLikeRequestedFactory(
            { likeGateway },
            () => {
                try {
                    doExpectations();
                    resolve({});
                } catch (e) {
                    reject(e);
                }
            }
        ).middleware; // on passe un Middleware au store
    };

    const createReduxStoreWithListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (value: unknown) => void
    ) => {
        const listeners = [
            captureMw, // 👈 d’abord le capteur
            createOnLikeSetRequestedListener(doExpectations, resolve, reject)
        ];
        const s = initReduxStore({
            gateways: { likeGateway },                      // pas utilisé par le listener (fermeture), mais OK
            listeners,                                      // style formateur: des Middleware
        });
        spyDispatch(s); // 👈 active la capture d’actions
        return s;
    };
});

export function waitForState<T>(
    get: () => T,
    predicate: (v: T) => boolean,
    { timeout = 2000, interval = 10 } = {}
): Promise<void> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tick = () => {
            try {
                if (predicate(get())) return resolve();
                if (Date.now() - start > timeout) return reject(new Error("waitForState timeout"));
                setTimeout(tick, interval);
            } catch (e) {
                reject(e);
            }
        };
        tick();
    });
}
function defer<T>() {
    let resolve!: (v: T) => void, reject!: (e: any) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}
