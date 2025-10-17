import {addOptimisticCreated, enqueueCommitted, outboxProcessOnce} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {DependenciesWl} from "@/app/store/appStateWl";
import {processOutboxFactory} from "@/app/contextWL/outboxWl/processOutbox";
import {commandKinds, statusTypes} from "@/app/contextWL/outboxWl/outbox.type";
import {FakeCommentGatewayWl} from "@/app/adapters/secondary/gateways/fake/fakeCommentGatewayWl";
import {moderationTypes} from "@/app/contextWL/commentWl/type/commentWl.type";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";

describe('On outboxProcessOnce triggered : ', () => {
    let store: ReduxStoreWl
    let dependencies: DependenciesWl
    let commentGateway: FakeCommentsWlGateway

    beforeEach(() => {
        commentGateway = new FakeCommentsWlGateway()
    })
    afterEach(() => {
        commentGateway.willFail = false
    })
    it('should, when happy path, mark status to awaitingAck and enqueue',() => {
        return new Promise(async (resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualOutbox(),
                resolve,
                reject,
            );
            store.dispatch(enqueueCommitted(outboxRecord))
            expect(store.getState().oState.queue.length).toEqual(1);
            store.dispatch(outboxProcessOnce())
            await flush()
        })
    })
    it('should, when gateway throw error, update comment and outbox state',() => {
        commentGateway.willFail = true
        return new Promise(async (resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualOutboxwithErrorThrown(),
                resolve,
                reject,
            );
            store.dispatch(enqueueCommitted(outboxRecord))
            store.dispatch(addOptimisticCreated({
                entity: commentEntity
            }))
            expect(store.getState().oState.queue.length).toEqual(1);
            expect(store.getState().oState.byId["obx_0001"]).toBeDefined()
            expect(store.getState().oState.byCommandId["cmd_aaa111"]).toBeDefined()
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids.length).toEqual(1)
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids[0]).toEqual("cmt_tmp_aaa111")
            store.dispatch(outboxProcessOnce())
            await flush()
        })
    })

    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    function expectActualOutbox() {
        expect(store.getState().oState.queue.length).toEqual(0);
        expect(store.getState().oState.byId["obx_0001"].status).toEqual(statusTypes.awaitingAck)
    }
    function expectActualOutboxwithInvalidCommand() {
        expect(store.getState().oState.queue.length).toEqual(0);
        expect(store.getState().oState.byId["obx_0001"]).toEqual(undefined)
        expect(store.getState().oState.byCommandId["cmd_aaa111"]).toEqual(undefined)
    }
    function expectActualOutboxwithErrorThrown() {
        expect(store.getState().oState.queue.length).toEqual(0);
        expect(store.getState().oState.byId["obx_0001"].status).toEqual(statusTypes.failed)
        expect(store.getState().oState.byId["obx_0001"].lastError).toEqual("error from server")
        expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids).toEqual([])
    }
    function createReduxStoreWithListener(
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: () => void,
    ) {
        return initReduxStoreWl({
            dependencies:{},
            listeners:[
                createOnprocessOutboxUseCaseListener(doExpectations, resolve, reject),
            ]
        })
    }
    const createOnprocessOutboxUseCaseListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    )=>{
        return processOutboxFactory({
            gateways: {
                comments: commentGateway,
            },
            helpers: {
                nowIso: () => new Date().toISOString(),
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

    const outboxRecord = {
        id: "obx_0001",
        item: {
            command: {
                kind: commandKinds.CommentCreate,
                commandId: "cmd_aaa111",
                tempId: "cmt_tmp_aaa111",
                targetId: "cafe_fragments_rennes",
                body: "Excellent flat white, ambiance au top.",
                createdAt: "2025-10-10T07:00:00.000Z",
            },
            undo: {
                kind: commandKinds.CommentCreate,
                tempId: "cmt_tmp_aaa111",
                targetId: "cafe_fragments_rennes",
            },
        },
        enqueuedAt: "2025-10-10T07:00:01.000Z",
    }
    const outboxRecordInvalid = {
        id: "obx_0001",
        item: {
            command: {
                kind: commandKinds.CommentUpdate,
                commandId: "cmd_aaa111",
                tempId: "cmt_tmp_aaa111",
                targetId: "cafe_fragments_rennes",
                body: "Excellent flat white, ambiance au top.",
                createdAt: "2025-10-10T07:00:00.000Z",
            },
            undo: {
                kind: commandKinds.CommentUpdate,
                tempId: "cmt_tmp_aaa111",
                targetId: "cafe_fragments_rennes",
            },
        },
        enqueuedAt: "2025-10-10T07:00:01.000Z",
    }
    const commentEntity = {
        id: "cmt_tmp_aaa111",
        targetId:"cafe_fragments_rennes",
        parentId:undefined,
        body: "Excellent flat white, ambiance au top.",
        authorId: "unUser",
        createdAt: "2025-10-10T07:00:00.000Z",
        likeCount: 0,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 0,
        optimistic: true,
    }
})