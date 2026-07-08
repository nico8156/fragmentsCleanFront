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

const makeSequencedDeps = (p: {
    likes: FakeLikesGateway;
    authToken: FakeAuthTokenBridge;
    nowIso: ISODate;
    outboxIds: string[];
    commandIds: CommandId[];
}): DependenciesWl => {
    let outboxIndex = 0;
    let commandIndex = 0;
    return {
        gateways: {
            likes: p.likes,
            authToken: p.authToken as any,
        },
        helpers: {
            nowIso: () => p.nowIso,
            currentUserId: () => "user_test",
            currentUserProfile: () => null,
            newCommandId: () => p.commandIds[commandIndex++],
            getCommandIdForTests: () => p.outboxIds[outboxIndex++],
        },
    };
};

describe("Like toggle listener (optimistic + enqueue)", () => {
    it("ADD: works before the initial likes read has completed", async () => {
        const likes = new FakeLikesGateway();
        const authToken = new FakeAuthTokenBridge("token_test", "user_test");

        const deps = makeDeps({
            likes,
            authToken,
            nowIso: "2025-10-10T07:02:00.000Z" as ISODate,
            outboxId: "obx_like_empty",
            commandId: "cmd_like_empty" as CommandId,
        });

        const store = initReduxStoreWl({
            dependencies: deps,
            listeners: [likeToggleUseCaseFactory(deps).middleware],
        });

        store.dispatch(uiLikeToggleRequested({ targetId: "cafe_A" }));
        await flushPromises();

        const s = store.getState() as any;
        expect(s.lState.byTarget.cafe_A).toMatchObject({
            count: 1,
            me: true,
            optimistic: true,
        });
        expect(s.oState.byId.obx_like_empty.item.command.kind).toBe(commandKinds.LikeAdd);
    });

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

    it("keeps optimistic like over stale refresh and allows opposite unlike while add is pending", async () => {
        const likes = new FakeLikesGateway();
        const authToken = new FakeAuthTokenBridge("token_test", "user_test");

        const deps = makeSequencedDeps({
            likes,
            authToken,
            nowIso: "2025-10-10T07:02:00.000Z" as ISODate,
            outboxIds: ["obx_like_001", "obx_unlike_001"],
            commandIds: ["cmd_like_001" as CommandId, "cmd_unlike_001" as CommandId],
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

        store.dispatch(
            likesRetrieved({
                targetId: "cafe_A",
                count: 10,
                me: false,
                version: 1,
                serverTime: "2025-10-10T07:01:10.000Z" as ISODate,
            }),
        );

        let s = store.getState() as any;
        expect(s.lState.byTarget["cafe_A"]).toMatchObject({
            count: 11,
            me: true,
            optimistic: true,
            version: 1,
        });

        store.dispatch(uiLikeToggleRequested({ targetId: "cafe_A" }));
        await flushPromises();

        s = store.getState() as any;
        const agg = s.lState.byTarget["cafe_A"];
        expect(agg).toMatchObject({
            count: 10,
            me: false,
            optimistic: true,
            version: 1,
        });
        expect(Object.keys(s.oState.byId)).toEqual(["obx_like_001", "obx_unlike_001"]);
        expect(s.oState.queue).toEqual(["obx_like_001", "obx_unlike_001"]);
        expect(s.oState.byId.obx_like_001.item.command.kind).toBe(commandKinds.LikeAdd);
        expect(s.oState.byId.obx_unlike_001.item.command.kind).toBe(commandKinds.LikeRemove);
    });
});
