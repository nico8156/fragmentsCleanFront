// likeWl/usecases/write/likeToggle.listener.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {FakeLikesGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {
    likeToggleUseCaseFactory,
    uiLikeToggleRequested
} from "@/app/contextWL/likeWl/usecases/write/likePressedUseCase";
import {likesRetrieved} from "@/app/contextWL/likeWl/typeAction/likeWl.action";
import {commandKinds, ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";

import {
    LikeAddCommand,
    LikeAddUndo,
    LikeRemoveCommand,
    LikeRemoveUndo
} from "@/app/contextWL/outboxWl/type/commandForLike.type";



describe("Like toggle listener (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;
    let likes: FakeLikesGateway;

    beforeEach(() => {
        likes = new FakeLikesGateway();
        store = initReduxStoreWl({
            dependencies: { gateways: { likes } },
            listeners: [
                likeToggleUseCaseFactory({
                    gateways: { likes },
                    helpers: {
                        nowIso: () => "2025-10-10T07:02:00.000Z",
                        currentUserId: () => "user_test",
                        getCommandIdForTests: () => "obx_like_001", // outboxId déterministe
                    },
                }).middleware,
            ],
        });
        // Seed: état serveur initial (non liké)
        store.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 10,
                me: false,
                version: 1,
                serverTime: "2025-10-10T07:01:00.000Z" as ISODate,
            })
        );
    });

    it("ADD: optimistic + outbox enqueued", () => {
        store.dispatch(uiLikeToggleRequested({ targetId: "cafe_A" }));

        const s = store.getState();
        const agg = s.lState.byTarget["cafe_A"];
        expect(agg.me).toBe(true);
        expect(agg.count).toBe(11);
        expect(agg.optimistic).toBe(true);

        const obxId = "obx_like_001";
        const rec = s.oState.byId[obxId];
        expect(rec).toBeDefined();
        expect(s.oState.queue).toContain(obxId);
        const command = rec.item.command as LikeAddCommand;
        expect(command.kind).toBe(commandKinds.LikeAdd);
        expect(command.targetId).toBe("cafe_A");
        // snapshot undo pour rollback
        const undo = rec.item.undo as LikeAddUndo;
        expect(undo.prevCount).toBe(10);
        expect(undo.prevMe).toBe(false);
    });

    it("REMOVE: optimistic + outbox enqueued", () => {
        // on part d'un état liké
        store.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 11,
                me: true,
                version: 2,
                serverTime: "2025-10-10T07:01:10.000Z" as ISODate,
            })
        );

        // nouveau outboxId pour ce test
        const store2 = initReduxStoreWl({
            dependencies: { gateways: { likes } },
            listeners: [
                likeToggleUseCaseFactory({
                    gateways: { likes },
                    helpers: {
                        nowIso: () => "2025-10-10T07:02:10.000Z",
                        currentUserId: () => "user_test",
                        getCommandIdForTests: () => "obx_unlike_001",
                    },
                }).middleware,
            ],
        });
        // re-seed même état
        store2.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 11,
                me: true,
                version: 2,
                serverTime: "2025-10-10T07:01:10.000Z" as ISODate,
            })
        );

        store2.dispatch(uiLikeToggleRequested({ targetId: "cafe_A" }));

        const s = store2.getState();
        const agg = s.lState.byTarget["cafe_A"];
        expect(agg.me).toBe(false);
        expect(agg.count).toBe(10);
        expect(agg.optimistic).toBe(true);

        const rec = s.oState.byId["obx_unlike_001"];
        expect(rec.item.command.kind).toBe(commandKinds.LikeRemove);
        const undo = rec.item.undo as LikeRemoveUndo
        const command = rec.item.command as LikeRemoveCommand;
        expect(command.targetId).toBe("cafe_A");
        expect(undo.prevCount).toBe(11);
        expect(undo.prevMe).toBe(true);
    });
});
