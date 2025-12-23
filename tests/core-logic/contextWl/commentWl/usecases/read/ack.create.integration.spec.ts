// commentCreate.ack.integration.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

import {
    ackListenerFactory,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

import {
    enqueueCommitted,
    addOptimisticCreated,
} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";

import {
    CommandId,
    commandKinds,
    ISODate,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

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

describe("SyncEvent → comment.createdAck (integration)", () => {
    let store: ReduxStoreWl;
    const flush = () => new Promise<void>((r) => setTimeout(r, 0));

    beforeEach(async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        store = initReduxStoreWl({
            dependencies: {
                gateways: {},
                helpers: {},
            },
            listeners: [
                syncEventsListenerFactory({ metaStorage }),
                ackListenerFactory({ gateways: {}, helpers: {} }, () => {}).middleware,
            ],
        });

        // seed outbox + optimistic
        store.dispatch(
            enqueueCommitted({
                id: "obx_0001",
                item: {
                    command: {
                        kind: commandKinds.CommentCreate,
                        commandId: "cmd_abc" as CommandId,
                        tempId: "cmt_tmp_123",
                        targetId: "cafe_A",
                        body: "Un super café !",
                        at: "2025-10-10T07:00:00.000Z" as ISODate,
                    },
                    undo: {
                        kind: commandKinds.CommentCreate,
                        tempId: "cmt_tmp_123",
                        targetId: "cafe_A",
                    },
                },
                enqueuedAt: "2025-10-10T07:00:00.000Z",
            }),
        );

        store.dispatch(
            addOptimisticCreated({
                entity: {
                    id: "cmt_tmp_123",
                    targetId: "cafe_A",
                    body: "Un super café !",
                    authorId: "user_test",
                    createdAt: "2025-10-10T07:00:00.000Z",
                    likeCount: 0,
                    replyCount: 0,
                    moderation: moderationTypes.PUBLISHED,
                    version: 0,
                    optimistic: true,
                },
            }),
        );
    });

    it("applies comment.createdAck from SyncEvent, replaces tempId and drops outbox", async () => {
        const metaStorage = createMemorySyncMetaStorage();
        await metaStorage.loadOrDefault();

        const syncEvent: SyncEvent = {
            id: "evt-comment-created-1",
            happenedAt: "2025-10-10T07:00:05.000Z" as ISODate,
            type: "comment.createdAck",
            payload: {
                commandId: "cmd_abc",
                tempId: "cmt_tmp_123",
                server: {
                    id: "cmt_srv_999",
                    createdAt: "2025-10-10T07:00:05.000Z" as ISODate,
                    version: 2,
                },
            } as any,
        };

        store.dispatch(syncEventsReceived([syncEvent]));
        await flush();

        const s = store.getState();

        // ✅ reconcile
        expect(s.cState.byTarget["cafe_A"].ids[0]).toBe("cmt_srv_999");
        expect(s.cState.entities.entities["cmt_tmp_123"]).toBeUndefined();
        expect(s.cState.entities.entities["cmt_srv_999"]).toMatchObject({
            id: "cmt_srv_999",
            createdAt: "2025-10-10T07:00:05.000Z",
            version: 2,
            optimistic: false,
        });

        // ✅ outbox nettoyée
        expect(s.oState.byCommandId["cmd_abc"]).toBeUndefined();
        expect(s.oState.byId["obx_0001"]).toBeUndefined();
    });
});
