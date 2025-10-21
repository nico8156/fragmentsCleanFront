// ticketWl/usecases/read/ackTickets.spec.ts
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase"; // même action utilisée pour enregistrer l'item outbox
import {ackTicketsListenerFactory, onTicketConfirmedAck, onTicketRejectedAck} from "./ackTicket";
import {commandKinds} from "@/app/contextWL/outboxWl/type/outbox.type";
import {CommandId, ISODate, TicketId} from "@/app/contextWL/ticketWl/typeAction/ticket.type";
import {flush} from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";

describe("Tickets ACK (reconcile tkState + entitlements + drop outbox)", () => {
    let store: ReturnType<typeof initReduxStoreWl>;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackTicketsListenerFactory()],
        });
        // seed outbox: la commande verify envoyée
        store.dispatch(
            enqueueCommitted({
                id: "obx_tk_001",
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: "cmd_tk_verify_001" as CommandId,
                        ticketId: "tk_001",
                        imageRef: "file://local/photo1.jpg",
                        at: "2025-10-10T07:07:00.000Z" as ISODate,
                    },
                    undo: { kind: commandKinds.TicketVerify, ticketId: "tk_001" },
                },
                enqueuedAt: "2025-10-10T07:07:00.000Z",
            })
        );
    });

    it("ACK confirmed: tkState=CONFIRMED, enState increments, outbox dropped", async () => {
        store.dispatch(
            onTicketConfirmedAck({
                commandId: "cmd_tk_verify_001" as CommandId,
                ticketId: "tk_001" as TicketId,
                server: {
                    status: "CONFIRMED",
                    version: 2,
                    amountCents: 920,
                    currency: "EUR",
                    ticketDate: "2025-10-09T12:00:00.000Z" as ISODate,
                    updatedAt: "2025-10-10T07:07:05.000Z" as ISODate,
                },
                // l’ACK emporte l’info user courante (ou join côté listener)
                userId: "user_test",
            })
        );
        await flush();
        // ticket reconcilié
        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.amountCents).toBe(920);
        expect(tk.optimistic).toBe(false);

        // entitlements (read model)
        // const en = store.getState().enState.byUser["user_test"];
        // expect(en).toBeDefined();
        // expect(en.confirmedTickets).toBe(1);
        // expect(en.rights).toContain("LIKE"); // palier 1
        // // pas encore COMMENT/SUBMIT_CAFE (selon seuils 3 et 5)
        // expect(en.rights).not.toContain("COMMENT");
        // expect(en.rights).not.toContain("SUBMIT_CAFE");

        // outbox droppée
        const o = store.getState().oState;

        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });

    it("ACK rejected: tkState=REJECTED, entitlements unchanged, outbox dropped", async () => {
        store.dispatch(
            onTicketRejectedAck({
                commandId: "cmd_tk_verify_001" as CommandId,
                ticketId: "tk_001" as TicketId,
                server: {
                    status: "REJECTED",
                    reason: "duplicate",
                    version: 2,
                    updatedAt: "2025-10-10T07:07:06.000Z" as ISODate,
                },
                userId: "user_test",
            })
        );
        await flush();

        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("REJECTED");
        expect(tk.rejectionReason).toBe("duplicate");
        expect(tk.optimistic).toBe(false);

        // const en = store.getState().enState.byUser["user_test"];
        // // non créé/inchangé
        // expect(en).toBeUndefined();

        const o = store.getState().oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });
});
