
import {onTicketConfirmedAck} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {ackEntitlementsListener} from "@/app/core-logic/contextWL/entitlementWl/usecases/read/ackEntitlement";
import {CommandId} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {entitlementsSetThresholds} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.action";

describe("Entitlements projection on TicketConfirmed ACK", () => {
    let store : ReduxStoreWl;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackEntitlementsListener()],
        })
    })

    it("unlocks LIKE (1), COMMENT (3), SUBMIT_CAFE (5)", () => {

        store.dispatch(entitlementsSetThresholds({ likeAt: 1, commentAt: 3, submitCafeAt: 5 }));

        const ack = (n: number) =>
            store.dispatch(
                onTicketConfirmedAck({
                    commandId: `cmd_${n}` as CommandId,
                    ticketId: `tk_${n}` as any,
                    userId: "user_test",
                    server: {
                        status: "CONFIRMED",
                        version: n,
                        amountCents: 500,
                        currency: "EUR",
                        ticketDate: "2025-10-09T12:00:00.000Z" as any,
                        updatedAt: `2025-10-10T07:0${n}:00.000Z` as any,
                    },
                })
            );

        // 1er ticket
        ack(1);
        let ue = store.getState().enState.byUser["user_test"];
        let threshold = store.getState().enState.thresholds;
        expect(ue.confirmedTickets).toBe(1);
        expect(ue.rights).toContain("LIKE");
        expect(ue.rights).not.toContain("COMMENT");

        // 3e ticket
        ack(2);
        ack(3);
        ue = store.getState().enState.byUser["user_test"];
        expect(ue.confirmedTickets).toBe(3);
        expect(ue.rights).toContain("COMMENT");
        expect(ue.rights).not.toContain("SUBMIT_CAFE");

        // 5e ticket
        ack(4);
        ack(5);
        ue = store.getState().enState.byUser["user_test"];
        expect(ue.confirmedTickets).toBe(5);
        expect(ue.rights).toContain("SUBMIT_CAFE");
    });
});
