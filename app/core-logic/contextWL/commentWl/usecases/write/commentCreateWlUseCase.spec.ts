import {uiCommentCreateRequested, createCommentUseCaseFactory} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import {CommentCreateCommand} from "@/app/core-logic/contextWL/outboxWl/type/commandForComment.type";

describe('On comment creation button pressed : ', () => {
    let store: ReduxStoreWl
    let commentGateway: FakeCommentsWlGateway

    beforeEach(() => {
        commentGateway = new FakeCommentsWlGateway()
    })

    it('should add optimistic comment and new command', () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualCommentAndOutbox(),
                resolve,
                reject,
            );
            store.dispatch(uiCommentCreateRequested({
                targetId:"un id de cafe",
                body:"un commentaire",
            }))
        })
    })
    it('should not add optimistic comment and command if body is empty', () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => {
                    expect(store.getState().cState.entities.entities).toStrictEqual({})
                    expect(store.getState().cState.byTarget["un id de cafe"]).toBeUndefined()
                    expect(store.getState().oState.queue.length).toEqual(0);
                },
                resolve,
                reject,
            );
            store.dispatch(uiCommentCreateRequested({
                targetId:"un id de cafe",
                body:"",
            }))

        })
    })
    function createReduxStoreWithListener(
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: () => void,
    ) {
        return initReduxStoreWl({
            dependencies:{
            },
            listeners:[
                createOnccListener(doExpectations, resolve, reject),
            ]
        })
    }

    function expectActualCommentAndOutbox() {
        const tid  = "un id de cafe";
        const tmp  = "cmt_tmp_Yffc7N3rOvXUYWMCLZnGT";
        const obx  = "obc_tmp_Yffc7N3rOvXUYWMCLZnGT";
        const s    = store.getState();
        // Vue par target
        expect(s.cState.byTarget[tid]).toBeDefined();
        expect(s.cState.byTarget[tid]!.ids[0]).toEqual(tmp); // prepend (tri "new")

        // Entité optimistic
        expect(s.cState.entities.entities[tmp]!.body).toEqual("un commentaire");
        expect(s.cState.entities.entities[tmp]!.optimistic).toBe(true);
        expect(s.cState.entities.entities[tmp]!.targetId).toEqual(tid);

        // Outbox
        expect(s.oState.byCommandId[s.oState.byId[obx]!.item.command.commandId]).toBe(obx);
        expect(s.oState.byId[obx]).toBeDefined();
        expect((s.oState.byId[obx]!.item.command as CommentCreateCommand).body).toEqual("un commentaire");
        expect(s.oState.byId[obx]!.status).toBe("queued");
        expect(s.oState.queue[0]).toBe(obx);
    }
    const createOnccListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    )=>{
        return createCommentUseCaseFactory({
            gateways: {
                comments:commentGateway
            },
            helpers: {
                nowIso: () => new Date().toISOString(),
                currentUserId: () => "testUser",
                getCommentIdForTests: () => "cmt_tmp_Yffc7N3rOvXUYWMCLZnGT",
                getCommandIdForTests: () => "obc_tmp_Yffc7N3rOvXUYWMCLZnGT"
            }
        }, () => {
            try {
                doExpectations();
                resolve({});
            } catch (error) {
                reject(error);
            }
        }).middleware;
    }
})


