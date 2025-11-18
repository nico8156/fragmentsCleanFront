// app/core-logic/contextWL/appWl/usecases/runtimeListener.spec.ts

import { FakeCoffeeGateway } from "../../../../adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import { initReduxStoreWl, ReduxStoreWl } from "../../../../store/reduxStoreWl";
import { createActionsRecorder } from "../../../../store/middleware/actionRecorder";

import {
    appBecameActive,
    appBootRequested,
    appConnectivityChanged,
    appHydrationDone,
    appWarmupDone,
    appBootSucceeded,
    appBootFailed,
} from "../typeAction/appWl.action";

import {
    replayRequested,
    syncDecideRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";

import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe("On runtimeListener triggered :", () => {
    let store: ReduxStoreWl;
    let coffeeGateway: FakeCoffeeGateway;
    let rec: ReturnType<typeof createActionsRecorder>;

    beforeEach(() => {
        coffeeGateway = new FakeCoffeeGateway();
        rec = createActionsRecorder();
        store = initReduxStoreWl({
            dependencies: {
                gateways: {
                    coffees: coffeeGateway,
                },
            },
            listeners: [runtimeListenerFactory({} as any)],
            extraMiddlewares: [rec.middleware],
        });
    });

    afterEach(() => {
        coffeeGateway.willFailGet = false;
    });

    it("should, on happy path, dispatch hydration, warmup and boot_succeeded", async () => {
        store.dispatch(appBootRequested());
        await flush();

        const types = rec.getTypes().filter(Boolean);

        expect(types).toEqual(
            expect.arrayContaining([
                appHydrationDone.type,
                appWarmupDone.type,
                appBootSucceeded.type,
            ]),
        );
    });


    it("should, if error thrown, trigger boot_failed action", async () => {
        coffeeGateway.willFailGet = true;

        store.dispatch(appBootRequested());
        await flush();

        const types = rec.getTypes();

        expect(types).toEqual(
            expect.arrayContaining([
                appBootFailed.type,
            ]),
        );
    });

    it("should on appBecameActive triggered, call processOnce (outbox) + replay + syncDecide", () => {
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

    it("should on appConnectivityChanged(online: true) trigger processOnce (outbox) + syncDecide", () => {
        store.dispatch(appConnectivityChanged({ online: true }));

        const types = rec.getTypes();

        expect(types).toEqual(
            expect.arrayContaining([
                outboxProcessOnce.type,
                syncDecideRequested.type,
            ]),
        );
    });

    it("should on appConnectivityChanged(online: false) NOT trigger outboxProcessOnce nor syncDecide", () => {
        store.dispatch(appConnectivityChanged({ online: false }));

        const types = rec.getTypes();

        expect(types).not.toEqual(
            expect.arrayContaining([
                outboxProcessOnce.type,
                syncDecideRequested.type,
            ]),
        );
    });
});
