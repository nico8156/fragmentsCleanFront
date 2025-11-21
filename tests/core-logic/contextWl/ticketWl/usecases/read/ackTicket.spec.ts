// ticketWl/usecases/read/ackTickets.spec.ts
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase"; // même action utilisée pour enregistrer l'item outbox

import {commandKinds} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {CommandId, ISODate, TicketId} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {flush} from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import {
    ackTicketsListenerFactory,
    onTicketConfirmedAck, onTicketRejectedAck
} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import {computeBadgeProgressFromState} from "@/app/core-logic/contextWL/userWl/badges/computeBadgeProgress";
import {UserId} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {getDefaultBadgeProgress} from "@/app/core-logic/contextWL/userWl/badges/badges";
import {authUserHydrationSucceeded} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

describe("Tickets ACK (reconcile tkState + entitlements + drop outbox)", () => {
    let store: ReturnType<typeof initReduxStoreWl>;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackTicketsListenerFactory()],
        });
        // seed outbox: la commande verify envoyée
        store.dispatch(
            enqueueCommitted({
                id: "obx_tk_001",
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: "cmd_tk_verify_001" as CommandId,
                        ticketId: "tk_001",
                        imageRef: "file://local/photo1.jpg",
                        at: "2025-10-10T07:07:00.000Z" as ISODate,
                    },
                    undo: { kind: commandKinds.TicketVerify, ticketId: "tk_001" },
                },
                enqueuedAt: "2025-10-10T07:07:00.000Z",
            })
        );
    });

    it("ACK confirmed: tkState=CONFIRMED, enState increments, outbox dropped", async () => {
        store.dispatch(
            onTicketConfirmedAck({
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
                // l’ACK emporte l’info user courante (ou join côté listener)
                userId: "user_test",
            })
        );
        await flush();
        // ticket reconcilié
        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.amountCents).toBe(920);
        expect(tk.optimistic).toBe(false);

        // entitlements (read model)
        // const en = store.getState().enState.byUser["user_test"];
        // expect(en).toBeDefined();
        // expect(en.confirmedTickets).toBe(1);
        // expect(en.rights).toContain("LIKE"); // palier 1
        // // pas encore COMMENT/SUBMIT_CAFE (selon seuils 3 et 5)
        // expect(en.rights).not.toContain("COMMENT");
        // expect(en.rights).not.toContain("SUBMIT_CAFE");

        // outbox droppée
        const o = store.getState().oState;

        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });

    it("ACK rejected: tkState=REJECTED, entitlements unchanged, outbox dropped", async () => {
        store.dispatch(
            onTicketRejectedAck({
                commandId: "cmd_tk_verify_001" as CommandId,
                ticketId: "tk_001" as TicketId,
                server: {
                    status: "REJECTED",
                    reason: "duplicate",
                    version: 2,
                    updatedAt: "2025-10-10T07:07:06.000Z" as ISODate,
                },
                userId: "user_test",
            })
        );
        await flush();

        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("REJECTED");
        expect(tk.rejectionReason).toBe("duplicate");
        expect(tk.optimistic).toBe(false);

        // const en = store.getState().enState.byUser["user_test"];
        // // non créé/inchangé
        // expect(en).toBeUndefined();

        const o = store.getState().oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });
});


describe("Tickets ACK (reconcile tkState + badges + drop outbox)", () => {
    let store: ReturnType<typeof initReduxStoreWl>;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackTicketsListenerFactory()],
        });

        // 1️⃣ seed outbox: la commande verify envoyée
        store.dispatch(
            enqueueCommitted({
                id: "obx_tk_001",
                item: {
                    command: {
                        kind: commandKinds.TicketVerify,
                        commandId: "cmd_tk_verify_001" as CommandId,
                        ticketId: "tk_001",
                        imageRef: "file://local/photo1.jpg",
                        at: "2025-10-10T07:07:00.000Z" as ISODate,
                    },
                    undo: { kind: commandKinds.TicketVerify, ticketId: "tk_001" },
                },
                enqueuedAt: "2025-10-10T07:07:00.000Z",
            }),
        );

        // 2️⃣ seed user courant (pour que userBadgeProgressUpdated ait un currentUser)
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
                        // on part du default, comme en prod
                        badgeProgress: getDefaultBadgeProgress(),
                    },
                    likedCoffeeIds: [],
                    version: 1,
                },
            }),
        );
    });

    it("ACK confirmed: tkState=CONFIRMED, badges updated, outbox dropped", async () => {
        store.dispatch(
            onTicketConfirmedAck({
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
            }),
        );

        await flush();

        // ✅ ticket reconcilié
        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("CONFIRMED");
        expect(tk.version).toBe(2);
        expect(tk.amountCents).toBe(920);
        expect(tk.optimistic).toBe(false);

        // ✅ badges mis à jour (intégration listener + compute)
        const stateAfter = store.getState();
        const badgeProgressFromStore = stateAfter.aState.currentUser?.preferences?.badgeProgress;
        const recomputed = computeBadgeProgressFromState(stateAfter);

        expect(badgeProgressFromStore).toBeDefined();
        expect(badgeProgressFromStore).toEqual(recomputed);

        // ✅ outbox droppée
        const o = stateAfter.oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });

    it("ACK rejected: tkState=REJECTED, badges unchanged, outbox dropped", async () => {
        // on capture l'état initial des badges pour vérifier qu'il ne bouge pas
        const badgeProgressBefore = store.getState().aState.currentUser?.preferences?.badgeProgress;

        store.dispatch(
            onTicketRejectedAck({
                commandId: "cmd_tk_verify_001" as CommandId,
                ticketId: "tk_001" as TicketId,
                server: {
                    status: "REJECTED",
                    reason: "duplicate",
                    version: 2,
                    updatedAt: "2025-10-10T07:07:06.000Z" as ISODate,
                },
                userId: "user_test",
            }),
        );
        await flush();

        const tk = store.getState().tState.byId["tk_001" as TicketId];
        expect(tk.status).toBe("REJECTED");
        expect(tk.rejectionReason).toBe("duplicate");
        expect(tk.optimistic).toBe(false);

        // ❌ pas de mise à jour des badges sur rejet
        const badgeProgressAfter = store.getState().aState.currentUser?.preferences?.badgeProgress;
        expect(badgeProgressAfter).toEqual(badgeProgressBefore);

        const o = store.getState().oState;
        expect(o.byId["obx_tk_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_tk_verify_001"]).toBeUndefined();
    });
});
