// ticketWl/usecases/write/ticketSubmit.listener.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {
    ticketSubmitUseCaseFactory,
    uiTicketSubmitRequested,
} from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";
import {CommandId, ISODate, TicketId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {commandKinds} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";
import {FakeTicketsGateway} from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import {TicketVerifyCommand, TicketVerifyUndo} from "@/app/core-logic/contextWL/outboxWl/type/commandForTicket.type";

describe("Ticket submit listener (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;
    let tickets: FakeTicketsGateway;

    beforeEach(() => {
        tickets = new FakeTicketsGateway();
        store = initReduxStoreWl({
            dependencies: { gateways: { tickets } },
            listeners: [
                ticketSubmitUseCaseFactory({
                    gateways: { tickets },
                    helpers: {
                        nowIso: () => "2025-10-10T07:07:00.000Z" as ISODate,
                        currentUserId: () => "user_test",
                        newTicketIdForTests: () => "tk_001" as TicketId,
                        getCommandIdForTests: () => "cmd_tk_verify_001" as CommandId,
                    },
                }),
            ],
        });
    });

    it("submit: create tk aggregate (CAPTURED→ANALYZING) + outbox enqueued", () => {
        store.dispatch(
            uiTicketSubmitRequested({
                imageRef: "file://local/photo1.jpg",
                ocrText: null,
            })
        );

        const s = store.getState();
        const tk = s.tState.byId["tk_001" as TicketId];
        expect(tk).toBeDefined();
        // juste après submit, on place en ANALYZING (ou CAPTURED selon ton choix de UX)
        expect(tk.status).toBe("ANALYZING");
        expect(tk.optimistic).toBe(true);
        expect(tk.createdAt).toBe("2025-10-10T07:07:00.000Z");

        // outbox
        const obxId = s.oState.queue[0];
        const rec = s.oState.byId[obxId];

        expect(rec).toBeDefined();
        const item = rec.item.command as TicketVerifyCommand;
        expect(item.kind).toBe(commandKinds.TicketVerify);
        expect(item.commandId).toBe("cmd_tk_verify_001");
        expect(item.imageRef).toBe("file://local/photo1.jpg");
        // snapshot undo (revient à état "absent")
        const undo = rec.item.undo as TicketVerifyUndo
        expect(undo.kind).toBe(commandKinds.TicketVerify);
        expect(undo.ticketId).toBe("tk_001");
    });
});
