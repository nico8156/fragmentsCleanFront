// ticketWl/usecases/read/ticketRetrieval.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";

import { ticketRetrieval } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ticketRetrieval";
import {ticketRetrieved} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import {ISODate, TicketId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

describe("Ticket retrieval", () => {
    let store: ReduxStoreWl;

    beforeEach(() => {
        store = initReduxStoreWl({ dependencies: {} });
    });

    it("happy path: set status/payload/version + success", async () => {
        // Ici on simule que ton usecase `ticketRetrieval` se contente d’aller chercher et de dispatcher ticketRetrieved
        await store.dispatch(
            ticketRetrieval({
                ticketId: "tk_001",
                // pour le test on injecte un fake résultat directement via une callback (selon ton impl.)
                __testServer__: {
                    status: "ANALYZING",
                    version: 2,
                    updatedAt: "2025-10-10T07:05:00.000Z" as ISODate,
                    ocrText: "cafe la plume 9,20€ 09/10/2025",
                },
            }) as any
        );

        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk).toBeDefined();
        expect(tk.status).toBe("ANALYZING");
        expect(tk.version).toBe(2);
        expect(tk.updatedAt).toBe("2025-10-10T07:05:00.000Z");
        expect(tk.loading).toBe("success");
        expect(tk.ocrText).toBe("cafe la plume 9,20€ 09/10/2025");
    });

    it("manual seed with reducer (ex: from SSR)", () => {
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
