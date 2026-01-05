import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";

import { uiCommentCreateRequested, createCommentUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { commandKinds, type CommandId, type ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { CommentCreateCommand } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForComment.type";
import {FakeCommentsWlGateway} from "@/tests/core-logic/fakes/FakeCommentsWlGateway";



const flushPromises = () => new Promise<void>((r) => setImmediate(r));

describe("Comment create (optimistic + enqueue)", () => {
    let store: ReduxStoreWl;
    let comments: FakeCommentsWlGateway;

    const tid = "un id de cafe";
    const tmp = "cmt_tmp_Yffc7N3rOvXUYWMCLZnGT";
    const obx = "obc_tmp_Yffc7N3rOvXUYWMCLZnGT";
    const cmdId = "cmd_cmt_001" as CommandId;

    const makeDeps = (): DependenciesWl => ({
        gateways: { comments } as any,
        helpers: {
            nowIso: () => "2025-10-10T07:02:00.000Z" as ISODate,
            currentUserId: () => "testUser",
            currentUserProfile: () => ({ displayName: "Moi", avatarUrl: "http://avatar" }),
            newCommandId: () => cmdId,

            getCommentIdForTests: () => tmp,
            getCommandIdForTests: () => obx,
        },
    });

    beforeEach(() => {
        comments = new FakeCommentsWlGateway();
        const deps = makeDeps();

        store = initReduxStoreWl({
            dependencies: deps,
            listeners: [createCommentUseCaseFactory(deps).middleware],
        });
    });

    it("should add optimistic comment and new outbox command", async () => {
        store.dispatch(uiCommentCreateRequested({ targetId: tid, body: "un commentaire" }));
        await flushPromises();

        const s: any = store.getState();

        // view
        expect(s.cState.byTarget[tid]).toBeDefined();
        expect(s.cState.byTarget[tid]!.ids[0]).toBe(tmp);

        // entity optimistic
        const ent = s.cState.entities.entities[tmp];
        expect(ent).toBeDefined();
        expect(ent.body).toBe("un commentaire");
        expect(ent.optimistic).toBe(true);
        expect(ent.targetId).toBe(tid);
        expect(ent.authorId).toBe("testUser");
        expect(ent.authorName).toBe("Moi");
        expect(ent.avatarUrl).toBe("http://avatar");

        // outbox
        const rec = s.oState.byId[obx];
        expect(rec).toBeDefined();
        expect(s.oState.queue[0]).toBe(obx);

        const cmd = rec.item.command as CommentCreateCommand;
        expect(cmd.kind).toBe(commandKinds.CommentCreate);
        expect(cmd.commandId).toBe(cmdId);
        expect(cmd.tempId).toBe(tmp);
        expect(cmd.targetId).toBe(tid);
        expect(cmd.body).toBe("un commentaire");

        expect(s.oState.byCommandId[cmdId]).toBe(obx);
    });

    it("should not enqueue nor create optimistic comment if body is empty", async () => {
        store.dispatch(uiCommentCreateRequested({ targetId: tid, body: "   " }));
        await flushPromises();

        const s: any = store.getState();
        expect(s.cState.entities.entities).toStrictEqual({});
        expect(s.cState.byTarget[tid]).toBeUndefined();
        expect(s.oState.queue.length).toBe(0);
    });

    it("should do nothing if currentUser is anonymous", async () => {
        const depsAnon: DependenciesWl = {
            ...makeDeps(),
            helpers: {
                ...makeDeps().helpers,
                currentUserId: () => "anonymous",
            },
        };

        const store2 = initReduxStoreWl({
            dependencies: depsAnon,
            listeners: [createCommentUseCaseFactory(depsAnon).middleware],
        });

        store2.dispatch(uiCommentCreateRequested({ targetId: tid, body: "un commentaire" }));
        await flushPromises();

        const s: any = store2.getState();
        expect(s.cState.entities.entities).toStrictEqual({});
        expect(s.oState.queue.length).toBe(0);
    });
});
