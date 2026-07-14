// ticketWl/usecases/read/ticketRetrieval.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";

import { refreshNonTerminalTickets, ticketRetrieval } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketRetrieval";
import {ticketOptimisticCreated, ticketRetrieved} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {ISODate, TicketId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { FakeTicketsGateway } from "@/tests/core-logic/fakes/fakeTicketWlGateway";
import { enqueueCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

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

    it("refreshes known non-terminal tickets after a missed projection event", async () => {
        const tickets = new FakeTicketsGateway();
        tickets.nextStatusResponse = {
            ...tickets.nextStatusResponse,
            status: "CONFIRMED",
            outcome: "APPROVED",
            version: 3,
            occurredAt: "2026-07-14T06:10:00.000Z",
            amountCents: 660,
            currency: "EUR",
        };
        store = initReduxStoreWl({
            dependencies: {
                gateways: { tickets } as any,
            },
        });

        store.dispatch(ticketRetrieved({
            ticketId: "tk_pending" as TicketId,
            status: "ANALYZING",
            version: 1,
            updatedAt: "2026-07-14T06:00:00.000Z" as ISODate,
        }));
        store.dispatch(ticketRetrieved({
            ticketId: "tk_done" as TicketId,
            status: "CONFIRMED",
            version: 2,
            updatedAt: "2026-07-14T06:01:00.000Z" as ISODate,
        }));

        await store.dispatch(refreshNonTerminalTickets() as any);

        expect(tickets.getStatusCalls.map((call) => call.ticketId)).toEqual(["tk_pending"]);
        expect(store.getState().tState.byId["tk_pending" as TicketId].status).toBe("CONFIRMED");
    });

    it("does not refresh a local ticket while its outbox command is still pending", async () => {
        const tickets = new FakeTicketsGateway();
        store = initReduxStoreWl({
            dependencies: {
                gateways: { tickets } as any,
            },
        });

        store.dispatch(ticketOptimisticCreated({
            ticketId: "tk_local" as TicketId,
            at: "2026-07-14T06:00:00.000Z" as ISODate,
            status: "ANALYZING",
        }));
        store.dispatch(enqueueCommitted({
            id: "obx_ticket",
            item: {
                command: {
                    kind: commandKinds.TicketVerify,
                    commandId: "cmd_ticket",
                    ticketId: "tk_local",
                    at: "2026-07-14T06:00:00.000Z",
                } as any,
                undo: { ticketId: "tk_local" } as any,
            },
            enqueuedAt: "2026-07-14T06:00:00.000Z",
        }) as any);

        await store.dispatch(refreshNonTerminalTickets() as any);

        expect(tickets.getStatusCalls).toEqual([]);
        expect(store.getState().tState.byId["tk_local" as TicketId].optimistic).toBe(true);
    });
});
