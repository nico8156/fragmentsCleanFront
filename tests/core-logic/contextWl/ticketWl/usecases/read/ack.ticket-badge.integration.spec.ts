import { initReduxStoreWl } from "@/app/store/reduxStoreWl";

import { enqueueCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import { CommandId, ISODate, TicketId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";


import { computeBadgeProgressFromState } from "@/app/core-logic/contextWL/userWl/badges/computeBadgeProgress";
import { UserId } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { getDefaultBadgeProgress } from "@/app/core-logic/contextWL/userWl/badges/badges";
import { authUserHydrationSucceeded } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import { syncEventsListenerFactory } from "@/app/core-logic/contextWL/outboxWl/sync_PARKING/parking/syncEventsListenerFactory";
import { syncEventsReceived } from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import { createMemorySyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";
import {ackTicketsListenerFactory} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";

describe("SyncEvent → ticket.*Ack (integration: tkState + badges + outbox)", () => {
    let store: ReturnType<typeof initReduxStoreWl>;
    let metaStorage: ReturnType<typeof createMemorySyncMetaStorage>;

    const flushMicro = async () => await new Promise<void>((r) => setTimeout(r, 0));

    // ✅ UUIDs
    const TICKET_ID = "11111111-1111-1111-1111-111111111111" as TicketId;
    const COMMAND_ID = "22222222-2222-2222-2222-222222222222" as CommandId;

    beforeEach(async () => {
        metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        store = initReduxStoreWl({
            dependencies: {},
            listeners: [syncEventsListenerFactory({ metaStorage }), ackTicketsListenerFactory()],
        });

        // 1️⃣ seed outbox: commande verify envoyée
        store.dispatch(
            enqueueCommitted({
                id: `obx_${COMMAND_ID}`,
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: COMMAND_ID,
                        ticketId: TICKET_ID,
                        imageRef: "file://local/photo1.jpg",
                        ocrText: null,
                        at: "2025-10-10T07:07:00.000Z" as ISODate,
                    },
                    undo: { kind: commandKinds.TicketVerify, ticketId: TICKET_ID },
                },
                enqueuedAt: "2025-10-10T07:07:00.000Z" as ISODate,
            })
        );

        // 2️⃣ seed user courant
        store.dispatch(
            authUserHydrationSucceeded({
                user: {
                    id: "user_test" as UserId,
                    createdAt: "2025-10-01T00:00:00.000Z" as ISODate,
                    updatedAt: "2025-10-01T00:00:00.000Z" as ISODate,
                    identities: [],
                    roles: [],
                    flags: {},
                    preferences: { badgeProgress: getDefaultBadgeProgress() },
                    likedCoffeeIds: [],
                    version: 1,
                },
            })
        );
    });

    it("ticket.confirmedAck → tk CONFIRMED, badges updated, outbox dropped", async () => {
        const evt: SyncEvent = {
            id: "evt-ticket-confirmed-badges-1",
            happenedAt: "2025-10-10T07:07:05.000Z" as ISODate,
            type: "ticket.confirmedAck",
            payload: {
                commandId: COMMAND_ID,
                ticketId: TICKET_ID,
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
        await flushMicro();
        await flushMicro();

        const stateAfter = store.getState();

        // ✅ ticket reconcilié
        const tk = stateAfter.tState.byId[TICKET_ID];
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.amountCents).toBe(920);
        // si ton reducer le fait :
        expect(tk.optimistic).toBe(false);

        // ✅ badges mis à jour (store == recompute)
        const badgeProgressFromStore = stateAfter.aState.currentUser?.preferences?.badgeProgress;
        const recomputed = computeBadgeProgressFromState(stateAfter);

        expect(badgeProgressFromStore).toBeDefined();
        expect(badgeProgressFromStore).toEqual(recomputed);

        // ✅ outbox droppée (3 index)
        const o = stateAfter.oState;
        expect(o.byId[`obx_${COMMAND_ID}`]).toBeUndefined();
        expect(o.byCommandId[COMMAND_ID]).toBeUndefined();
        expect(o.queue).not.toContain(`obx_${COMMAND_ID}`);
    });

    it("ticket.rejectedAck → tk REJECTED, badges unchanged, outbox dropped", async () => {
        const badgeProgressBefore = store.getState().aState.currentUser?.preferences?.badgeProgress;

        const evt: SyncEvent = {
            id: "evt-ticket-rejected-badges-1",
            happenedAt: "2025-10-10T07:07:06.000Z" as ISODate,
            type: "ticket.rejectedAck",
            payload: {
                commandId: COMMAND_ID,
                ticketId: TICKET_ID,
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
        await flushMicro();
        await flushMicro();

        const stateAfter = store.getState();

        const tk = stateAfter.tState.byId[TICKET_ID];
        expect(tk.status).toBe("REJECTED");
        expect(tk.rejectionReason).toBe("duplicate");
        expect(tk.optimistic).toBe(false);

        // ❌ pas de mise à jour des badges sur rejet
        const badgeProgressAfter = stateAfter.aState.currentUser?.preferences?.badgeProgress;
        expect(badgeProgressAfter).toEqual(badgeProgressBefore);

        const o = stateAfter.oState;
        expect(o.byId[`obx_${COMMAND_ID}`]).toBeUndefined();
        expect(o.byCommandId[COMMAND_ID]).toBeUndefined();
        expect(o.queue).not.toContain(`obx_${COMMAND_ID}`);
    });
});
