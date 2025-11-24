// ticketBadges.ack.integration.spec.ts
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";

import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { CommandId, ISODate, TicketId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { flush } from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";

import {
    ackTicketsListenerFactory,
} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import { computeBadgeProgressFromState } from "@/app/core-logic/contextWL/userWl/badges/computeBadgeProgress";
import { UserId } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { getDefaultBadgeProgress } from "@/app/core-logic/contextWL/userWl/badges/badges";
import { authUserHydrationSucceeded } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import {
    syncEventsListenerFactory,
} from "@/app/core-logic/contextWL/outboxWl/sync/syncEventsListenerFactory";
import {
    syncEventsReceived,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import {
    SyncEvent,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import {
    createMemorySyncMetaStorage,
} from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";

describe("SyncEvent → ticket.*Ack (integration: tkState + badges + outbox)", () => {
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

        // 1️⃣ seed outbox: commande verify envoyée
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
                    preferences: {
                        badgeProgress: getDefaultBadgeProgress(),
                    },
                    likedCoffeeIds: [],
                    version: 1,
                },
            }),
        );
    });

    it("SyncEvent ticket.confirmedAck → tkState=CONFIRMED, badges updated, outbox dropped", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const evt: SyncEvent = {
            id: "evt-ticket-confirmed-badges-1",
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
        await flushMicro();

        const stateAfter = store.getState();

        // ✅ ticket reconcilié
        const tk = stateAfter.tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.amountCents).toBe(920);
        expect(tk.optimistic).toBe(false);

        // ✅ badges mis à jour (progress en store == progress recomputé à partir du state)
        const badgeProgressFromStore = stateAfter.aState.currentUser?.preferences?.badgeProgress;
        const recomputed = computeBadgeProgressFromState(stateAfter);

        expect(badgeProgressFromStore).toBeDefined();
        expect(badgeProgressFromStore).toEqual(recomputed);

        // ✅ outbox droppée
        const o = stateAfter.oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });

    it("SyncEvent ticket.rejectedAck → tkState=REJECTED, badges unchanged, outbox dropped", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const badgeProgressBefore = store.getState().aState.currentUser?.preferences?.badgeProgress;

        const evt: SyncEvent = {
            id: "evt-ticket-rejected-badges-1",
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

        const stateAfter = store.getState();

        const tk = stateAfter.tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("REJECTED");
        expect(tk.rejectionReason).toBe("duplicate");
        expect(tk.optimistic).toBe(false);

        // ❌ pas de mise à jour des badges sur rejet
        const badgeProgressAfter = stateAfter.aState.currentUser?.preferences?.badgeProgress;
        expect(badgeProgressAfter).toEqual(badgeProgressBefore);

        const o = stateAfter.oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });
});
