import { ticketHistoryRetrieval } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketHistoryRetrieval";
import { ticketRetrieved } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import type { ISODate, TicketId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { FakeTicketsGateway } from "@/tests/core-logic/fakes/fakeTicketWlGateway";

describe("Ticket history retrieval", () => {
    it("loads a private server page and follows its opaque cursor", async () => {
        const tickets = new FakeTicketsGateway();
        tickets.nextHistoryResponse = {
            items: [{
                ticketId: "ticket-2",
                status: "COMPLETED",
                outcome: "APPROVED",
                amountCents: 930,
                currency: "EUR",
                ticketDate: "2026-09-10T12:00:00Z",
                merchantName: "Fragments Café",
                merchantAddress: "2 rue du Café",
                rejectionReason: null,
                version: 2,
                occurredAt: "2026-09-10T12:02:00Z",
            }],
            nextCursor: "djE6NDI",
        };
        const store = initReduxStoreWl({ dependencies: { gateways: { tickets } as any } });

        await store.dispatch(ticketHistoryRetrieval() as any);
        expect(tickets.listHistoryCalls[0]).toMatchObject({ cursor: undefined, limit: 20 });
        expect(store.getState().tState.history).toMatchObject({
            ids: ["ticket-2"], nextCursor: "djE6NDI", status: "success", initialized: true,
        });
        expect(store.getState().tState.byId["ticket-2" as TicketId]).toMatchObject({
            status: "CONFIRMED", amountCents: 930, merchantName: "Fragments Café", version: 2,
        });

        tickets.nextHistoryResponse = { items: [], nextCursor: null };
        await store.dispatch(ticketHistoryRetrieval({ reset: false }) as any);
        expect(tickets.listHistoryCalls[1]).toMatchObject({ cursor: "djE6NDI", limit: 20 });
        expect(store.getState().tState.history.nextCursor).toBeNull();
    });

    it("preserves richer cached detail while merging a summary", async () => {
        const tickets = new FakeTicketsGateway();
        tickets.nextHistoryResponse = {
            items: [{
                ticketId: "ticket-rich",
                status: "CONFIRMED",
                outcome: "APPROVED",
                merchantName: "Café serveur",
                version: 4,
                occurredAt: "2026-09-10T12:02:00Z",
            }],
            nextCursor: null,
        };
        const store = initReduxStoreWl({ dependencies: { gateways: { tickets } as any } });
        store.dispatch(ticketRetrieved({
            ticketId: "ticket-rich" as TicketId,
            status: "ANALYZING",
            version: 1,
            updatedAt: "2026-09-10T12:00:00Z" as ISODate,
            ocrText: "détail local privé",
            imageRef: "file://ticket.jpg",
        }));

        await store.dispatch(ticketHistoryRetrieval() as any);

        expect(store.getState().tState.byId["ticket-rich" as TicketId]).toMatchObject({
            status: "CONFIRMED",
            ocrText: "détail local privé",
            imageRef: "file://ticket.jpg",
            merchantName: "Café serveur",
        });
    });

    it("keeps cached history visible after a network error", async () => {
        const tickets = new FakeTicketsGateway();
        const store = initReduxStoreWl({ dependencies: { gateways: { tickets } as any } });
        tickets.nextHistoryResponse = {
            items: [{ ticketId: "ticket-cache", status: "CONFIRMED", version: 1, occurredAt: "2026-09-10T12:00:00Z" }],
            nextCursor: null,
        };
        await store.dispatch(ticketHistoryRetrieval() as any);
        tickets.shouldFailGetStatus = true;

        await store.dispatch(ticketHistoryRetrieval() as any);

        expect(store.getState().tState.history.status).toBe("error");
        expect(store.getState().tState.history.ids).toEqual(["ticket-cache"]);
        expect(store.getState().tState.byId["ticket-cache" as TicketId]).toBeDefined();
    });
});
