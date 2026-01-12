import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";

import { likeToggleUseCaseFactory, uiLikeToggleRequested } from "@/app/core-logic/contextWL/likeWl/usecases/write/likePressedUseCase";
import { likesRetrieved } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { commandKinds, ISODate, CommandId } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {FakeLikesGateway} from "@/tests/core-logic/fakes/FakeLikesGateway";
import {FakeAuthTokenBridge} from "@/tests/core-logic/fakes/FakeAuthTokenBridge";


const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

const makeDeps = (p: {
    likes: FakeLikesGateway;
    authToken: FakeAuthTokenBridge;
    nowIso: ISODate;
    outboxId: string;
    commandId: CommandId;
}): DependenciesWl => ({
    gateways: {
        likes: p.likes,
        authToken: p.authToken as any,
    },
    helpers: {
        // HelpersCore
        nowIso: () => p.nowIso,
        currentUserId: () => "user_test",
        currentUserProfile: () => null,
        newCommandId: () => p.commandId,

        // HelpersTest
        getCommandIdForTests: () => p.outboxId,
    },
});

describe("Like toggle listener (optimistic + enqueue)", () => {
    it("ADD: optimistic + outbox enqueued (fully deterministic)", async () => {
        const likes = new FakeLikesGateway();
        const authToken = new FakeAuthTokenBridge("token_test", "user_test");

        const deps = makeDeps({
            likes,
            authToken,
            nowIso: "2025-10-10T07:02:00.000Z" as ISODate,
            outboxId: "obx_like_001",
            commandId: "cmd_like_001" as CommandId,
        });

        const store = initReduxStoreWl({
            dependencies: deps,
            listeners: [likeToggleUseCaseFactory(deps).middleware],
        });

        store.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 10,
                me: false,
                version: 1,
                serverTime: "2025-10-10T07:01:00.000Z" as ISODate,
            }),
        );

        store.dispatch(uiLikeToggleRequested({ targetId: "cafe_A" }));
        await flushPromises();

        const s = store.getState() as any;

        // Like optimistic
        const agg = s.lState.byTarget["cafe_A"];
        expect(agg.me).toBe(true);
        expect(agg.count).toBe(11);
        expect(agg.optimistic).toBe(true);

        // Outbox record
	const rec = s.oState.byId["obx_like_001"];
        expect(rec).toBeDefined();
        expect(s.oState.queue).toContain("obx_like_001");

        const cmd = rec.item.command;
        expect(cmd.kind).toBe(commandKinds.LikeAdd);
        expect(cmd.commandId).toBe("cmd_like_001");
        expect(cmd.targetId).toBe("cafe_A");
        expect(cmd.at).toBe("2025-10-10T07:02:00.000Z");

        const undo = rec.item.undo;
        expect(undo.kind).toBe(commandKinds.LikeAdd);
        expect(undo.targetId).toBe("cafe_A");
        expect(undo.prevCount).toBe(10);
        expect(undo.prevMe).toBe(false);
        expect(undo.prevVersion).toBe(1);

        expect(s.oState.byCommandId["cmd_like_001"]).toBe("obx_like_001");

        // outboxProcessOnce est dispatché mais skip (pas signedIn) => aucun appel gateway
        expect(likes.addCalls).toHaveLength(0);
        expect(likes.removeCalls).toHaveLength(0);
    });

    it("REMOVE: optimistic + outbox enqueued (fully deterministic)", async () => {
        const likes = new FakeLikesGateway();
        const authToken = new FakeAuthTokenBridge("token_test", "user_test");

        const deps = makeDeps({
            likes,
            authToken,
            nowIso: "2025-10-10T07:02:10.000Z" as ISODate,
            outboxId: "obx_unlike_001",
            commandId: "cmd_unlike_001" as CommandId,
        });

        const store = initReduxStoreWl({
            dependencies: deps,
            listeners: [likeToggleUseCaseFactory(deps).middleware],
        });

        store.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 11,
                me: true,
                version: 2,
                serverTime: "2025-10-10T07:01:10.000Z" as ISODate,
            }),
        );

        store.dispatch(uiLikeToggleRequested({ targetId: "cafe_A" }));
        await flushPromises();

        const s = store.getState() as any;

        const agg = s.lState.byTarget["cafe_A"];
        expect(agg.me).toBe(false);
        expect(agg.count).toBe(10);
        expect(agg.optimistic).toBe(true);

        const rec = s.oState.byId["obx_unlike_001"];
        expect(rec).toBeDefined();
        expect(s.oState.queue).toContain("obx_unlike_001");

        const cmd = rec.item.command;
        expect(cmd.kind).toBe(commandKinds.LikeRemove);
        expect(cmd.commandId).toBe("cmd_unlike_001");
        expect(cmd.targetId).toBe("cafe_A");
        expect(cmd.at).toBe("2025-10-10T07:02:10.000Z");

        const undo = rec.item.undo;
        expect(undo.kind).toBe(commandKinds.LikeRemove);
        expect(undo.targetId).toBe("cafe_A");
        expect(undo.prevCount).toBe(11);
        expect(undo.prevMe).toBe(true);
        expect(undo.prevVersion).toBe(2);

        expect(s.oState.byCommandId["cmd_unlike_001"]).toBe("obx_unlike_001");

        expect(likes.addCalls).toHaveLength(0);
        expect(likes.removeCalls).toHaveLength(0);
    });
});
