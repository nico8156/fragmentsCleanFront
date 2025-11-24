// tests/core-logic/contextWl/outboxWl/processTicket.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";

import {commandKinds, parseToCommandId, statusTypes} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { FakeTicketsGateway } from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import {parseToISODate} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

describe("processOutboxFactory – TicketVerify", () => {
    let store: ReduxStoreWl;
    const FIXED_NOW = Date.parse("2025-10-10T07:03:00.000Z");
    const flush = () => new Promise<void>((r) => setTimeout(r, 0));

    const initStore = (gateways: any, helpers?: any) =>
        initReduxStoreWl({
            dependencies: {
                gateways,
                helpers: {
                    nowMs: () => FIXED_NOW,
                    nowPlusMs: (ms: number) => new Date(FIXED_NOW + ms).toISOString(),
                    ...(helpers ?? {}),
                },
            },
            listeners: [
                processOutboxFactory({
                    gateways,
                    helpers: {
                        nowMs: () => FIXED_NOW,
                        nowPlusMs: (ms: number) => new Date(FIXED_NOW + ms).toISOString(),
                        ...(helpers ?? {}),
                    },
                }).middleware,
            ],
        });

    // ---------- TICKET VERIFY – HAPPY PATH ----------
    it("TICKET VERIFY — happy path: queued → processing → awaitingAck + dequeue", async () => {
        const tickets = new FakeTicketsGateway();
        store = initStore({ tickets });

        // seed: record en queue
        store.dispatch(
            enqueueCommitted({
                id: "obx_tk_001",
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: parseToCommandId("cmd_tk_001"),
                        ticketId: "tk_001",
                        imageRef: "file://local/photo1.jpg",
                        ocrText: "TOTAL 12,34 EUR",
                        at: parseToISODate("2025-10-10T07:00:00.000Z"),
                    },
                    undo: {
                        kind: commandKinds.TicketVerify,
                        ticketId: "tk_001",
                    },
                },
                enqueuedAt: "2025-10-10T07:00:01.000Z",
            }),
        );

        // act
        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        const rec = s.byId["obx_tk_001"];

        expect(rec).toBeDefined();
        expect(rec.status).toBe(statusTypes.awaitingAck);
        // TicketVerify utilise Date.now() directement → on ne teste pas la valeur exacte
        expect(rec.nextCheckAt).toBeDefined();
        expect(typeof rec.nextCheckAt).toBe("string");

        // plus dans la queue
        expect(s.queue).toEqual([]);

        // mapping toujours présent (drop sera fait à l’ACK)
        expect(s.byCommandId["cmd_tk_001"]).toBe("obx_tk_001");
    });

    // ---------- TICKET VERIFY – ERROR ----------
    it("TICKET VERIFY — error: rollback + queued + retry scheduled", async () => {
        const tickets = new FakeTicketsGateway();
        tickets.willFailVerify = true;
        store = initStore({ tickets });

        store.dispatch(
            enqueueCommitted({
                id: "obx_tk_002",
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: parseToCommandId("cmd_tk_002"),
                        ticketId: "tk_002",
                        imageRef: "file://local/photo2.jpg",
                        ocrText: "TOTAL 20,00 EUR",
                        at: parseToISODate("2025-10-10T07:00:00.000Z"),
                    },
                    undo: {
                        kind: commandKinds.TicketVerify,
                        ticketId: "tk_002",
                    },
                },
                enqueuedAt: "2025-10-10T07:00:02.000Z",
            }),
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        const rec = s.byId["obx_tk_002"];

        expect(rec).toBeDefined();
        // Après markFailed + scheduleRetry → status remis à queued
        expect(rec.status).toBe(statusTypes.queued);
        expect(rec.lastError).toBe("ticket verify failed");

        // Toujours en queue, prêt pour un retry plus tard
        expect(s.queue).toEqual(["obx_tk_002"]);

        // Retry planifié
        expect((rec as any).nextAttemptAt).toBeDefined();
        expect(typeof (rec as any).nextAttemptAt).toBe("number");

        // mapping commandId → outboxId conservé
        expect(s.byCommandId["cmd_tk_002"]).toBe("obx_tk_002");
    });
    // ---------- TICKET VERIFY — NO GATEWAY ----------
    it("TICKET VERIFY — no gateway: markFailed + drop + dequeue", async () => {
        // aucun gateway.tickets passé ici
        store = initStore({});

        store.dispatch(
            enqueueCommitted({
                id: "obx_tk_003",
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: parseToCommandId("cmd_tk_003"),
                        ticketId: "tk_003",
                        imageRef: "file://local/photo3.jpg",
                        ocrText: "TOTAL 5,00 EUR",
                        at: parseToISODate("2025-10-10T07:00:00.000Z"),
                    },
                    undo: {
                        kind: commandKinds.TicketVerify,
                        ticketId: "tk_003",
                    },
                },
                enqueuedAt: "2025-10-10T07:00:03.000Z",
            }),
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;

        // record supprimé (dropCommitted)
        expect(s.byId["obx_tk_003"]).toBeUndefined();
        // mapping supprimé
        expect(s.byCommandId["cmd_tk_003"]).toBeUndefined();
        // queue vide
        expect(s.queue).toEqual([]);
    });
});
