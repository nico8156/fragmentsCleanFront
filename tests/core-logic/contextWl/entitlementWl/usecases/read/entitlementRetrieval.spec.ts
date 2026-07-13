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
        expect(ue.publishedComments).toBe(2);
        expect(ue.confirmedLikes).toBe(1);
        expect(ue.rights).toEqual(["LIKE", "COMMENT"]);
        expect(ue.pass?.currentLevel).toBe("URBAN_EXPLORER");
        expect(ue.pass?.levels?.[0].status).toBe("COMPLETED");
    });

    it("keeps rights published by the gateway even when thresholds would compute differently", async () => {
        entitlementsGateway.store.set("user_backend_policy", {
            userId: "user_backend_policy",
            confirmedTickets: 0,
            rights: ["SUBMIT_CAFE"],
            updatedAt: "2025-10-10T07:10:00.000Z" as ISODate,
        });

        await store.dispatch<any>(entitlementsRetrieval({ userId: "user_backend_policy" }));

        const ue = store.getState().enState.byUser["user_backend_policy"];
        expect(ue.confirmedTickets).toBe(0);
        expect(ue.rights).toEqual(["SUBMIT_CAFE"]);
    });
    const entitlementForTest :UserEntitlements = {
        userId: "user_test",
        confirmedTickets: 4,
        publishedComments: 2,
        confirmedLikes: 1,
        rights: ["LIKE", "COMMENT"],
        updatedAt: "2025-10-10T07:10:00.000Z" as ISODate,
        pass: {
            currentLevel: "URBAN_EXPLORER",
            counters: {
                validatedTickets: 4,
                publishedComments: 2,
                confirmedLikes: 1,
            },
            levels: [
                {
                    level: "COFFEE_TASTER",
                    status: "COMPLETED",
                    requirements: { validatedTickets: 3 },
                    unlockedCapabilities: ["SCAN_TICKET"],
                },
                {
                    level: "URBAN_EXPLORER",
                    status: "IN_PROGRESS",
                    requirements: { validatedTickets: 5, publishedComments: 3 },
                    unlockedCapabilities: ["COMMENT"],
                },
            ],
        },
    }
});
