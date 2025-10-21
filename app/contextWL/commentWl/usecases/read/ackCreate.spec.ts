// commentCreate.ack.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes} from "@/app/contextWL/commentWl/type/commentWl.type";
import { ackListenerFactory, onCommentCreatedAck } from "@/app/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import { enqueueCommitted, addOptimisticCreated } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {CommandId, commandKinds, ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";

describe("Create ACK (reconcile + drop outbox)", () => {
    let store: ReduxStoreWl;
    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackListenerFactory(
                { gateways: {}, helpers: {} },
                () => {}
            ).middleware]
        });

        // seed outbox + optimistic
        store.dispatch(enqueueCommitted({
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
                undo: { kind: commandKinds.CommentCreate, tempId: "cmt_tmp_123", targetId:"cafe_A"},
            },
            enqueuedAt: "2025-10-10T07:00:00.000Z",
        }));
        store.dispatch(addOptimisticCreated({
            entity: {
                id: "cmt_tmp_123",
                targetId: "cafe_A",
                body: "Un super café !",
                authorId: "user_test",
                createdAt: "2025-10-10T07:00:00.000Z",
                likeCount: 0, replyCount: 0,
                moderation: moderationTypes.PUBLISHED,
                version: 0, optimistic: true,
            }
        }));
    });

    it("should replace tempId by server id and drop outbox", async () => {
        store.dispatch(onCommentCreatedAck({
            commandId: "cmd_abc",
            tempId: "cmt_tmp_123",
            server: { id: "cmt_srv_999", createdAt: "2025-10-10T07:00:05.000Z", version: 2 },
        }));
        await flush();

        const s = store.getState();

        // reconcile
        expect(s.cState.byTarget["cafe_A"].ids[0]).toBe("cmt_srv_999");
        expect(s.cState.entities.entities["cmt_tmp_123"]).toBeUndefined();
        expect(s.cState.entities.entities["cmt_srv_999"]).toMatchObject({
            id: "cmt_srv_999",
            createdAt: "2025-10-10T07:00:05.000Z",
            version: 2,
            optimistic: false,
        });

        // drop outbox
        expect(s.oState.byCommandId["cmd_abc"]).toBeUndefined();
        expect(s.oState.byId["obx_0001"]).toBeUndefined();
    });
});
