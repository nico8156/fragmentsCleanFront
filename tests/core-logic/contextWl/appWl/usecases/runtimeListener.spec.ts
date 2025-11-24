import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { createActionsRecorder } from "@/app/store/middleware/actionRecorder";

import {
    appBecameActive, appBecameBackground,
    appConnectivityChanged,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import {
    replayRequested,
    syncDecideRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";

import {outboxProcessOnce, outboxSuspendRequested} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";


describe("runtimeListener (appWl) :", () => {
    let store: ReduxStoreWl;
    let rec: ReturnType<typeof createActionsRecorder>;

    beforeEach(() => {
        rec = createActionsRecorder();

        store = initReduxStoreWl({
            dependencies: {
                // runtimeListenerFactory ne dépend plus de gateways,
                // on peut donc passer un stub minimal ici.
                gateways: {} as any,
                helpers: {} as any,
            },
            listeners: [runtimeListenerFactory()],
            extraMiddlewares: [rec.middleware],
        });
    });

    it("should, on appBecameActive, dispatch outboxProcessOnce + replayRequested + syncDecideRequested", () => {
        store.dispatch(appBecameActive());

        const types = rec.getTypes();

        expect(types).toEqual(
            expect.arrayContaining([
                outboxProcessOnce.type,
                replayRequested.type,
                syncDecideRequested.type,
            ]),
        );
    });

    it("should, on appConnectivityChanged(online: true), dispatch outboxProcessOnce + syncDecideRequested", () => {
        store.dispatch(appConnectivityChanged({ online: true }));

        const types = rec.getTypes();

        expect(types).toEqual(
            expect.arrayContaining([
                outboxProcessOnce.type,
                syncDecideRequested.type,
            ]),
        );
    });

    it("should, on appConnectivityChanged(online: false), NOT dispatch outboxProcessOnce nor syncDecideRequested", () => {
        store.dispatch(appConnectivityChanged({ online: false }));

        const types = rec.getTypes();

        expect(types).not.toEqual(
            expect.arrayContaining([
                outboxProcessOnce.type,
                syncDecideRequested.type,
            ]),
        );
    });
    it("should, on appBecameBackground, dispatch outboxSuspendRequested only (no sync/outboxProcessOnce)", () => {
        store.dispatch(appBecameBackground());

        const types = rec.getTypes();

        // ✅ on demande la suspension de l'outbox
        expect(types).toEqual(
            expect.arrayContaining([outboxSuspendRequested.type]),
        );

        // ❌ pas de sync ni de process outbox en background
        expect(types).not.toEqual(
            expect.arrayContaining([
                outboxProcessOnce.type,
                syncDecideRequested.type,
                replayRequested.type,
            ]),
        );
    });


});
