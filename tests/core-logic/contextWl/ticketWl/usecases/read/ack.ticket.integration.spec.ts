// ticket.ack.integration.spec.ts
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";

import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { CommandId, ISODate, TicketId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { flush } from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";

import {
    ackTicketsListenerFactory,
} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";

import {
    syncEventsListenerFactory,
} from "@/app/core-logic/contextWL/outboxWl/sync_PARKING/parking/syncEventsListenerFactory";
import {
    syncEventsReceived,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import {
    SyncEvent,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import {
    createMemorySyncMetaStorage,
} from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";

describe("SyncEvent → ticket.*Ack (integration: tkState + outbox)", () => {
    let store: ReturnType<typeof initReduxStoreWl>;
    const flushMicro = () => new Promise<void>((r) => setTimeout(r, 0));

    beforeEach(async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        store = initReduxStoreWl({
            dependencies: {},
            listeners: [
                syncEventsListenerFactory({ metaStorage }),
                ackTicketsListenerFactory(),
            ],
        });

        // seed outbox: commande verify envoyée
        store.dispatch(
            enqueueCommitted({
                id: "obx_tk_001",
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: "cmd_tk_verify_001" as CommandId,
                        ticketId: "tk_001" as TicketId,
                        imageRef: "file://local/photo1.jpg",
                        at: "2025-10-10T07:07:00.000Z" as ISODate,
                    },
                    undo: { kind: commandKinds.TicketVerify, ticketId: "tk_001" as TicketId },
                },
                enqueuedAt: "2025-10-10T07:07:00.000Z",
            }),
        );
    });

    it("SyncEvent ticket.confirmedAck → tkState=CONFIRMED + outbox dropped", async () => {
        // comme dans ton modèle comments: création d’un metaStorage local même s’il ne sert pas
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const evt: SyncEvent = {
            id: "evt-ticket-confirmed-1",
            happenedAt: "2025-10-10T07:07:05.000Z" as ISODate,
            type: "ticket.confirmedAck",
            payload: {
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
                userId: "user_test",
            } as any,
        };

        store.dispatch(syncEventsReceived([evt]));
        await flush();
        await flushMicro(); // au cas où listeners asynchrones

        // ticket reconcilié
        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.amountCents).toBe(920);
        expect(tk.optimistic).toBe(false);

        // outbox droppée
        const o = store.getState().oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });

    it("SyncEvent ticket.rejectedAck → tkState=REJECTED + outbox dropped", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const evt: SyncEvent = {
            id: "evt-ticket-rejected-1",
            happenedAt: "2025-10-10T07:07:06.000Z" as ISODate,
            type: "ticket.rejectedAck",
            payload: {
                commandId: "cmd_tk_verify_001" as CommandId,
                ticketId: "tk_001" as TicketId,
                server: {
                    status: "REJECTED",
                    reason: "duplicate",
                    version: 2,
                    updatedAt: "2025-10-10T07:07:06.000Z" as ISODate,
                },
                userId: "user_test",
            } as any,
        };

        store.dispatch(syncEventsReceived([evt]));
        await flush();
        await flushMicro();

        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("REJECTED");
        expect(tk.rejectionReason).toBe("duplicate");
        expect(tk.optimistic).toBe(false);

        const o = store.getState().oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });
});
