import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { createActionsRecorder } from "@/app/store/middleware/actionRecorder";

import { syncEventsListenerFactory } from "@/app/core-logic/contextWL/outboxWl/sync/syncEventsListenerFactory";
import { syncEventsReceived } from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import { createMemorySyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

import {
    onLikeAddedAck,
} from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import {
    onCommentCreatedAck, onCommentDeletedAck, onCommentUpdatedAck,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import {onTicketConfirmedAck, onTicketRejectedAck} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

const makeStore = (
    metaStorage: ReturnType<typeof createMemorySyncMetaStorage>,
    rec: ReturnType<typeof createActionsRecorder>,
): ReduxStoreWl =>
    initReduxStoreWl({
        dependencies: {
            gateways: {},
            helpers: {},
        },
        listeners: [syncEventsListenerFactory({ metaStorage })],
        extraMiddlewares: [rec.middleware],
    });

describe("syncEventsListenerFactory", () => {
    it("applies events and records their IDs", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const likeEvent: SyncEvent = {
            id: "evt-like-1",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-like-1",
                targetId: "cafe_A",
                server: {
                    count: 1,
                    me: true,
                    version: 1,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        const commentEvent: SyncEvent = {
            id: "evt-comment-1",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "comment.createdAck",
            payload: {
                commandId: "cmd-comment-1",
                targetId: "cafe_A",
                commentId: "cmt_001",
                body: "hello",
                version: 1,
                createdAt: parseToISODate(new Date().toISOString()),
            } as any,
        };

        store.dispatch(syncEventsReceived([likeEvent, commentEvent]));
        await flush();

        const types = rec.getTypes();

        expect(types).toEqual(
            expect.arrayContaining([
                onLikeAddedAck.type,
                onCommentCreatedAck.type,
            ]),
        );

        const snapshot = metaStorage.getSnapshot();
        expect(snapshot.appliedEventIds).toEqual(
            expect.arrayContaining(["evt-like-1", "evt-comment-1"]),
        );
    });

    it("does not apply events that were already marked as applied before sync", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        // 🧩 Seed : l'event est déjà considéré comme appliqué avant le premier sync
        await metaStorage.markEventsApplied(["evt-like-seeded"], 2000);

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const event: SyncEvent = {
            id: "evt-like-seeded",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-seeded",
                targetId: "cafe_B",
                server: {
                    count: 2,
                    me: true,
                    version: 2,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        store.dispatch(syncEventsReceived([event]));
        await flush();

        const types = rec.getTypes();

        // Comme l'id était déjà connu, on ne doit pas rejouer l'ACK
        expect(types.filter((t: string) => t === onLikeAddedAck.type)).toHaveLength(0);

        const snapshot = metaStorage.getSnapshot();
        // l'id reste présent une seule fois
        expect(
            snapshot.appliedEventIds.filter((id: string) => id === "evt-like-seeded"),
        ).toHaveLength(1);
    });

    it("applies an event only once even if received multiple times", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const event: SyncEvent = {
            id: "evt-like-once",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-once",
                targetId: "cafe_C",
                server: {
                    count: 3,
                    me: true,
                    version: 1,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        // 1er sync : on applique l'event
        store.dispatch(syncEventsReceived([event]));
        await flush();

        // 2e sync : même event, même id
        store.dispatch(syncEventsReceived([event]));
        await flush();

        const types = rec.getTypes();

        // onLikeAddedAck ne doit être dispatché qu'une seule fois
        expect(types.filter((t: string) => t === onLikeAddedAck.type)).toHaveLength(1);

        const snapshot = metaStorage.getSnapshot();
        // appliedEventIds contient l'id une seule fois (à toi de voir comment tu le gères
        expect(
            snapshot.appliedEventIds.filter((id: string) => id === "evt-like-once"),
        ).toHaveLength(1);
    });
    it("applies events in happenedAt chronological order, regardless of reception order", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const earlier = parseToISODate("2024-01-01T10:00:00.000Z");
        const later   = parseToISODate("2024-01-01T11:00:00.000Z");

        const earlyEvent: SyncEvent = {
            id: "evt-early",
            happenedAt: earlier,
            type: "comment.createdAck",
            payload: {
                commandId: "cmd-early",
                targetId: "cafe_A",
                commentId: "cmt_early",
                body: "early",
                version: 1,
                createdAt: earlier,
            } as any,
        };

        const lateEvent: SyncEvent = {
            id: "evt-late",
            happenedAt: later,
            type: "like.addedAck",
            payload: {
                commandId: "cmd-late",
                targetId: "cafe_A",
                server: {
                    count: 1,
                    me: true,
                    version: 1,
                    updatedAt: later,
                },
            },
        };

        // 🪣 On envoie dans le MAUVAIS ordre : late puis early
        store.dispatch(syncEventsReceived([lateEvent, earlyEvent]));
        await flush();

        // Suivant ton recorder :
        // soit tu as rec.getActions()
        // soit seulement rec.getTypes()
        const actions = rec.getTypes() ? rec.getTypes() : rec.getTypes().map((type: string) => ({ type }));

        const ackTypes = actions
            .map(a => a.toString())
            .filter((t: string) =>
                t === onCommentCreatedAck.type ||
                t === onLikeAddedAck.type,
            );

        // ✅ On veut voir les ACKs dans l'ordre temporel : early puis late
        expect(ackTypes).toEqual([
            onCommentCreatedAck.type, // earlyEvent
            onLikeAddedAck.type,      // lateEvent
        ]);
    });
    it("marks unknown event types as applied but does not dispatch any ACK action", async () => {
        /*
        Tu veux au contraire NE PAS le marquer comme appliqué ==> choix invariant // metier

Politique : “je préfère continuer à le voir tant que le client n’est pas mis à jour”.

Dans ce cas :

tu fais évoluer le code pour ne pas pousser evt.id dans newlyApplied si type inconnu,

et tu écris la spec inverse.

L’important : cristalliser la décision dans une spec, parce que là c’est implicite.

        * */

        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const unknownEvent: SyncEvent = {
            id: "evt-unknown-1",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "foo.unknown" as SyncEvent["type"], // 👈 type non supporté par le switch
            payload: {
                some: "payload",
            } as any,
        };

        store.dispatch(syncEventsReceived([unknownEvent]));
        await flush();

        const actions = rec.getTypes();
        const ackTypes = actions
            .map((a) => a.toString())
            .filter((t: string) =>
                t === onLikeAddedAck.type ||
                t === onCommentCreatedAck.type ||
                t === onCommentUpdatedAck.type ||
                t === onCommentDeletedAck.type ||
                t === onTicketConfirmedAck.type ||
                t === onTicketRejectedAck.type ||
                false,
            );

        // ✅ Aucun ACK métier ne doit partir pour un type inconnu
        expect(ackTypes).toHaveLength(0);

        const snapshot = metaStorage.getSnapshot();

        // ✅ Mais l'id doit être marqué comme appliqué pour éviter de le revoir à chaque sync
        expect(snapshot.appliedEventIds).toEqual(
            expect.arrayContaining(["evt-unknown-1"]),
        );
        // optionnel : vérifier qu'il n'est présent qu'une fois
        expect(
            snapshot.appliedEventIds.filter((id: string) => id === "evt-unknown-1"),
        ).toHaveLength(1);
    });

    it("caps appliedEventIds to MAX_APPLIED_EVENT_IDS and keeps the newest ones", async () => {
        const MAX_APPLIED_EVENT_IDS = 2000;
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        // 1️⃣ On seed le storage avec MAX_APPLIED_EVENT_IDS - 1 ids
        const initialCount = MAX_APPLIED_EVENT_IDS - 1;
        const seededIds = Array.from({ length: initialCount }, (_, i) => `evt-seeded-${i}`);

        await metaStorage.markEventsApplied(seededIds, MAX_APPLIED_EVENT_IDS);

        // Sanity check (optionnel, mais ça documente bien l'intention)
        expect(metaStorage.getSnapshot().appliedEventIds.length).toBe(initialCount);

        // 2️⃣ On dispatch un batch avec plusieurs nouveaux events
        const newEventsCount = 5;
        const now = new Date();

        const newEvents: SyncEvent[] = Array.from(
            { length: newEventsCount },
            (_, i) => ({
                id: `evt-new-${i}`,
                happenedAt: parseToISODate(
                    new Date(now.getTime() + i * 1000).toISOString(),
                ),
                type: "like.addedAck",
                payload: {
                    commandId: `cmd-new-${i}`,
                    targetId: "cafe_CAP",
                    server: {
                        count: i + 1,
                        me: true,
                        version: 1,
                        updatedAt: parseToISODate(
                            new Date(now.getTime() + i * 1000).toISOString(),
                        ),
                    },
                },
            }),
        );

        store.dispatch(syncEventsReceived(newEvents));
        await flush();

        const snapshot = metaStorage.getSnapshot();
        const applied = snapshot.appliedEventIds;

        // 3️⃣ On vérifie que :
        // - la taille ne dépasse pas le cap
        // - tous les nouveaux ids sont bien présents
        expect(applied.length).toBeLessThanOrEqual(MAX_APPLIED_EVENT_IDS);

        newEvents.forEach((evt) => {
            expect(applied).toContain(evt.id);
        });

        // 4️⃣ (optionnel mais intéressant) :
        // on s'assure que certains tout premiers ids ont été évincés
        // pour faire de la place aux nouveaux
        const earliestSeededId = seededIds[0];
        // selon ta politique de trimming, tu peux rendre ça plus strict:
        // par ex. vérifier qu'au moins un des ids très anciens a sauté
        expect(applied).not.toContain(earliestSeededId);
    });
    it("does nothing when sync batch is empty", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const before = metaStorage.getSnapshot();

        store.dispatch(syncEventsReceived([]));
        await flush();

        const actions = rec.getTypes();
        const ackTypes = actions
            .map((a) => a.toString())
            .filter((t: string) =>
                t === onLikeAddedAck.type ||
                t === onCommentCreatedAck.type ||
                // si tu veux être complet :
                // t === onCommentUpdatedAck.type ||
                // t === onCommentDeletedAck.type ||
                // t === onTicketConfirmedAck.type ||
                // t === onTicketRejectedAck.type
                false,
            );

        // ✅ aucun ACK métier dispatché
        expect(ackTypes).toHaveLength(0);

        const after = metaStorage.getSnapshot();

        // ✅ meta strictement inchangée
        expect(after.appliedEventIds).toEqual(before.appliedEventIds);
    });

    it("applies an event only once when the same id appears multiple times in the same batch", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const rec = createActionsRecorder();
        const store = makeStore(metaStorage, rec);

        const event: SyncEvent = {
            id: "evt-like-duplicate-batch",
            happenedAt: parseToISODate(new Date().toISOString()),
            type: "like.addedAck",
            payload: {
                commandId: "cmd-dup-batch",
                targetId: "cafe_DUP",
                server: {
                    count: 5,
                    me: true,
                    version: 1,
                    updatedAt: parseToISODate(new Date().toISOString()),
                },
            },
        };

        // 👇 même event deux fois dans le MÊME batch
        store.dispatch(syncEventsReceived([event, event]));
        await flush();

        const actions = rec.getTypes();
        const ackTypes = actions
            .map(a => a.toString())
            .filter((t: string) => t === onLikeAddedAck.type);

        // ✅ ACK joué une seule fois
        expect(ackTypes).toHaveLength(1);

        const snapshot = metaStorage.getSnapshot();

        // ✅ id présent une seule fois dans appliedEventIds
        expect(
            snapshot.appliedEventIds.filter((id: string) => id === "evt-like-duplicate-batch"),
        ).toHaveLength(1);
    });


});
