import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {createActionsRecorder} from "@/app/store/middleware/actionRecorder";
import {runtimeListenerFactory} from "@/app/contextWL/appWl/usecases/runtimeListener";
import {appBecameActive, appBootRequested, appConnectivityChanged} from "@/app/contextWL/appWl/typeAction/appWl.action";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('On runtimeListener triggered : ', () => {

    let store: ReduxStoreWl;
    let coffeeGateway: FakeCoffeeGateway;
    let rec: any;

    beforeEach(() => {
        coffeeGateway = new FakeCoffeeGateway();
        rec = createActionsRecorder();
        store = initReduxStoreWl({
            dependencies: { gateways: {
                coffees:coffeeGateway} },
            listeners: [runtimeListenerFactory({} as any)],
            extraMiddlewares: [rec.middleware],   // 👈
        });
    })
    afterEach(() => {
        coffeeGateway.willFailGet = false;
    })

    it('should, on happy path, call hydration, warmup, succeed, processOnce', async () => {
        store.dispatch(appBootRequested());
        await flush();
        expect(rec.getTypes()).toEqual(expect.arrayContaining([
            "APP/HYDRATION_DONE",
            "APP/WARMUP_DONE",
            "APP/BOOT_SUCCEEDED",
            "COMMENT/OUTBOXPROCESSONCE",
        ]));
    })

    it("should, if error thrown, trigger boot_failed action", async () => {
        coffeeGateway.willFailGet = true;
        store.dispatch(appBootRequested());
        await flush();
        expect(rec.getTypes()).toEqual(expect.arrayContaining([
            "APP/BOOT_FAILED"
        ]));
    })
    it("should on appBecameActive triggered, call processOnce (outbox)", ()=> {
        store.dispatch(appBecameActive())
        expect(rec.getTypes()).toEqual(expect.arrayContaining([
            "COMMENT/OUTBOXPROCESSONCE",
        ]));
    })
    it("should on appConnectivityChanged triggered, call processOnce (outbox)", ()=> {
        store.dispatch(appConnectivityChanged({online: true}))
        expect(rec.getTypes()).toEqual(expect.arrayContaining([
            "COMMENT/OUTBOXPROCESSONCE",
        ]));
    })
})