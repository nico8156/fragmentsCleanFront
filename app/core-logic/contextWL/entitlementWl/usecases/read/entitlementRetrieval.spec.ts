import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeEntitlementWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import {entitlementsRetrieval} from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import {UserEntitlements} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";
import {ISODate} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";


describe("On Entitlements retrieval, ", () => {
    let store: ReduxStoreWl;
    let entitlementsGateway: FakeEntitlementWlGateway;

    beforeEach(() => {
        entitlementsGateway = new FakeEntitlementWlGateway()
        store = initReduxStoreWl({ dependencies: {
            gateways: { entitlements: entitlementsGateway}
        } });
    })
    it("should hydrates from gateway", async () => {
        entitlementsGateway.store.set("user_test", entitlementForTest)

        await store.dispatch<any>(entitlementsRetrieval({ userId: "user_test" }));

        const ue = store.getState().enState.byUser["user_test"];
        expect(ue.confirmedTickets).toBe(4);
        expect(ue.rights).toEqual(["LIKE", "COMMENT"]);
    });
    const entitlementForTest :UserEntitlements = {
        userId: "user_test",
        confirmedTickets: 4,
        rights: ["LIKE", "COMMENT"],
        updatedAt: "2025-10-10T07:10:00.000Z" as ISODate,
    }
});
