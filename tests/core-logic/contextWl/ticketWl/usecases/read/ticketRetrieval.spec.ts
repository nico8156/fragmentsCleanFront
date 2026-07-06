// ticketWl/usecases/read/ticketRetrieval.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";

import { ticketRetrieval } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketRetrieval";
import {ticketRetrieved} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {ISODate, TicketId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { FakeTicketsGateway } from "@/tests/core-logic/fakes/fakeTicketWlGateway";

describe("Ticket retrieval", () => {
    let store: ReduxStoreWl;

    it("calls the ticket status gateway and stores a snapshot", async () => {
        const tickets = new FakeTicketsGateway();
        tickets.nextStatusResponse = {
            ...tickets.nextStatusResponse,
            status: "COMPLETED",
            outcome: "APPROVED",
            version: 2,
            occurredAt: "2025-10-10T07:05:00.000Z",
            ocrText: "cafe la plume 9,20€ 09/10/2025",
            amountCents: 920,
            currency: "EUR",
        };
        store = initReduxStoreWl({
            dependencies: {
                gateways: {
                    tickets,
                } as any,
            },
        });

        await store.dispatch(
            ticketRetrieval({
                ticketId: "tk_001",
            }) as any
        );

        expect(tickets.getStatusCalls.map((call) => call.ticketId)).toEqual(["tk_001"]);
        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk).toBeDefined();
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.updatedAt).toBe("2025-10-10T07:05:00.000Z");
        expect(tk.loading).toBe("success");
        expect(tk.ocrText).toBe("cafe la plume 9,20€ 09/10/2025");
        expect(tk.amountCents).toBe(920);
    });

    it("manual seed with reducer (ex: from SSR)", () => {
        store = initReduxStoreWl({ dependencies: {} });
        store.dispatch(
            ticketRetrieved({
                ticketId: "tk_002" as TicketId,
                status: "CONFIRMED",
                version: 4,
                updatedAt: "2025-10-10T07:06:00.000Z" as ISODate,
                amountCents: 920,
                currency: "EUR",
            })
        );
        const tk = store.getState().tState.byId["tk_002" as TicketId];
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.amountCents).toBe(920);
    });
});
