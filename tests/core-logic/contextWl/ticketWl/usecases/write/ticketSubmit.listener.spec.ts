import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {
    ticketSubmitUseCaseFactory,
    uiTicketSubmitRequested,
} from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";

import {
    CommandId,
    ISODate,
    parseToTicketId,
    TicketId
} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {commandKinds, parseToCommandId} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import { TicketVerifyCommand, TicketVerifyUndo } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForTicket.type";
import {FakeTicketsGateway} from "@/tests/core-logic/fakes/fakeTicketWlGateway";


export const flushPromises = async (): Promise<void> =>
    await new Promise((resolve) => setTimeout(resolve, 0));


describe("Ticket submit listener (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;
    let tickets: FakeTicketsGateway;

    // ✅ vrais UUID (obligatoire si quelque part on parse en UUID)
    const TICKET_ID = "11111111-1111-1111-1111-111111111111" as TicketId;
    const COMMAND_ID = "22222222-2222-2222-2222-222222222222" as CommandId;
    const NOW = "2025-10-10T07:07:00.000Z" as ISODate;

    const commandId =
        ("22222222-2222-2222-2222-222222222222" as CommandId);

    beforeEach(() => {
        tickets = new FakeTicketsGateway();

        store = initReduxStoreWl({
            dependencies: { gateways: { tickets } },
            listeners: [
                ticketSubmitUseCaseFactory({
                    gateways: { tickets },
                    helpers: {
                        currentUserProfile: () => ({ displayName: "Moi", avatarUrl: "http://avatar" }),
                        newCommandId: () => commandId,

                        nowIso: () => NOW,
                        currentUserId: () => "user_test",
                        newTicketIdForTests: () => parseToTicketId(TICKET_ID),
                        getCommandIdForTests: () => parseToCommandId(COMMAND_ID),
                    },
                }),
            ],
        });
    });

    it("submit: create tk aggregate (optimistic ANALYZING) + outbox enqueued", async () => {
        store.dispatch(
            uiTicketSubmitRequested({
                imageRef: "file://local/photo1.jpg",
                ocrText: null,
            })
        );

        // ✅ laisse le listener async exécuter l'effect
        await flushPromises();

        const s = store.getState();
        const tk = s.tState.byId[TICKET_ID];

        expect(tk).toBeDefined();
        expect(tk.status).toBe("ANALYZING");
        expect(tk.optimistic).toBe(true);
        expect(tk.createdAt).toBe(NOW);

        // outbox
        const obxId = s.oState.queue[0];
        expect(obxId).toBeDefined();

        const rec = s.oState.byId[obxId];
        expect(rec).toBeDefined();

        const cmd = rec.item.command as TicketVerifyCommand;
        expect(cmd.kind).toBe(commandKinds.TicketVerify);
        expect(cmd.commandId).toBe(COMMAND_ID);
        expect(cmd.ticketId).toBe(TICKET_ID);
        expect(cmd.imageRef).toBe("file://local/photo1.jpg");
        expect(cmd.ocrText).toBeNull();
        expect(cmd.at).toBe(NOW);

        const undo = rec.item.undo as TicketVerifyUndo;
        expect(undo.kind).toBe(commandKinds.TicketVerify);
        expect(undo.ticketId).toBe(TICKET_ID);
    });
});
