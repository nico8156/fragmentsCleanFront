import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import { ISODate, TicketId, CommandId, UserId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { TicketVerifyCommand, TicketVerifyUndo } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForTicket.type";
import {
    ackTicketsListenerFactory,
    onTicketConfirmedAck, onTicketRejectedAck
} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";


const flush = async () => await new Promise((r) => setTimeout(r, 0));

describe("Tickets ACK listener", () => {
    let store: ReduxStoreWl;

    const TICKET_ID = "11111111-1111-1111-1111-111111111111" as TicketId;
    const COMMAND_ID = "22222222-2222-2222-2222-222222222222" as CommandId;
    const NOW = "2025-10-10T07:07:00.000Z" as ISODate;
    const USER_ID = "user_test" as UserId;

    const OUTBOX_ID = `obx_${COMMAND_ID}`;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: { gateways: {} } as any,
            listeners: [ackTicketsListenerFactory()],
        });

        // Arrange: outbox record présent + mapping byCommandId
        store.dispatch(
            enqueueCommitted({
                id: OUTBOX_ID,
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: COMMAND_ID,
                        ticketId: TICKET_ID,
                        imageRef: "file://local/photo1.jpg",
                        ocrText: null,
                        at: NOW,
                    } as TicketVerifyCommand,
                    undo: {
                        kind: commandKinds.TicketVerify,
                        ticketId: TICKET_ID,
                    } as TicketVerifyUndo,
                },
                enqueuedAt: NOW,
            })
        );

        const s = store.getState();
        expect(s.oState.byId[OUTBOX_ID]).toBeDefined();
        expect(s.oState.queue).toContain(OUTBOX_ID);
        expect(s.oState.byCommandId[COMMAND_ID]).toBe(OUTBOX_ID);
    });

    it("CONFIRMED: reconciles ticket + drops outbox (queue/byId/byCommandId)", async () => {
        store.dispatch(
            onTicketConfirmedAck({
                kind: "TicketConfirmedAck",
                commandId: COMMAND_ID,
                ticketId: TICKET_ID,
                userId: USER_ID,
                server: {
                    status: "CONFIRMED",
                    version: 2,
                    amountCents: 950,
                    currency: "EUR",
                    ticketDate: NOW,
                    updatedAt: NOW,
                    merchantName: "Café Test",
                },
            })
        );

        await flush();

        const s = store.getState();

        // ✅ dropped everywhere
        expect(s.oState.queue).not.toContain(OUTBOX_ID);
        expect(s.oState.byId[OUTBOX_ID]).toBeUndefined();
        expect(s.oState.byCommandId[COMMAND_ID]).toBeUndefined();

        // ✅ ticket reconciled
        const tk = s.tState.byId[TICKET_ID];
        expect(tk).toBeDefined();
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.amountCents).toBe(950);
        expect(tk.currency).toBe("EUR");
    });
    it("REJECTED: reconciles ticket + drops outbox (queue/byId/byCommandId)", async () => {
        store.dispatch(
            onTicketRejectedAck({
                kind: "TicketRejectedAck",
                commandId: COMMAND_ID,
                ticketId: TICKET_ID,
                userId: USER_ID,
                server: {
                    status: "REJECTED",
                    reason: "not a cafe receipt",
                    version: 2,
                    updatedAt: NOW,
                    merchantName: "??",
                },
            })
        );

        await flush();

        const s = store.getState();

        // ✅ dropped everywhere
        expect(s.oState.queue).not.toContain(OUTBOX_ID);
        expect(s.oState.byId[OUTBOX_ID]).toBeUndefined();
        expect(s.oState.byCommandId[COMMAND_ID]).toBeUndefined();

        // ✅ ticket reconciled
        const tk = s.tState.byId[TICKET_ID];
        expect(tk).toBeDefined();
        expect(tk.status).toBe("REJECTED");
        expect(tk.version).toBe(2);

        // selon ton reducer: souvent "rejectionReason" côté aggregate
        // si tu maps server.reason → rejectionReason
        expect(tk.rejectionReason).toBe("not a cafe receipt");
    });
});
