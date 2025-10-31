// likeWl/usecases/read/ackLikes.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {likesRetrieved} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import {CommandId, commandKinds, ISODate} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";
import { flush } from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {ackLikesListenerFactory, onLikeAddedAck, onLikeRemovedAck} from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";



describe("Likes ACK (reconcile + drop)", () => {
    let store: ReduxStoreWl;

    beforeEach(() => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackLikesListenerFactory().middleware],
        });

        // seed agg
        store.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 10,
                me: false,
                version: 1,
                serverTime: "2025-10-10T07:01:00.000Z",
            })
        );
    });

    it("ACK add: reconcile and drop outbox", async () => {
        // seed outbox LikeAdd
        store.dispatch(
            enqueueCommitted({
                id: "obx_like_001",
                item: {
                    command: {
                        kind: commandKinds.LikeAdd,
                        commandId: "cmd_like_001" as CommandId,
                        targetId: "cafe_A",
                        at: "2025-10-10T07:02:00.000Z" as ISODate,
                    },
                    undo: { kind: commandKinds.LikeAdd, targetId: "cafe_A", prevCount: 10, prevMe: false, prevVersion: 1 },
                },
                enqueuedAt: "2025-10-10T07:02:00.000Z",
            })
        );

        // ACK + flush
        store.dispatch(
            onLikeAddedAck({
                commandId: "cmd_like_001",
                targetId: "cafe_A",
                server: { count: 11, me: true, version: 2, updatedAt: "2025-10-10T07:02:05.000Z"as ISODate },
            })
        );
        await flush();

        const agg = store.getState().lState.byTarget["cafe_A"];
        expect(agg.count).toBe(11);
        expect(agg.me).toBe(true);
        expect(agg.version).toBe(2);
        expect(agg.optimistic).toBe(false);

        // drop
        const o = store.getState().oState;
        expect(o.byId["obx_like_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_like_001"]).toBeUndefined();
    });

    it("ACK remove: reconcile and drop outbox", async () => {
        // seed état liké
        store.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 11,
                me: true,
                version: 2,
                serverTime: "2025-10-10T07:01:30.000Z",
            })
        );
        // seed outbox LikeRemove
        store.dispatch(
            enqueueCommitted({
                id: "obx_unlike_001",
                item: {
                    command: {
                        kind: commandKinds.LikeRemove,
                        commandId: "cmd_unlike_001" as CommandId,
                        targetId: "cafe_A",
                        at: "2025-10-10T07:02:10.000Z" as ISODate,
                    },
                    undo: { kind: commandKinds.LikeRemove, targetId: "cafe_A", prevCount: 11, prevMe: true, prevVersion: 2 },
                },
                enqueuedAt: "2025-10-10T07:02:10.000Z",
            })
        );

        store.dispatch(
            onLikeRemovedAck({
                commandId: "cmd_unlike_001",
                targetId: "cafe_A",
                server: { count: 10, me: false, version: 3, updatedAt: "2025-10-10T07:02:15.000Z" as ISODate},
            })
        );
        await flush();

        const agg = store.getState().lState.byTarget["cafe_A"];
        expect(agg.count).toBe(10);
        expect(agg.me).toBe(false);
        expect(agg.version).toBe(3);
        expect(agg.optimistic).toBe(false);

        const o = store.getState().oState;
        expect(o.byId["obx_unlike_001"]).toBeUndefined();
        expect(o.byCommandId["cmd_unlike_001"]).toBeUndefined();
    });
});
