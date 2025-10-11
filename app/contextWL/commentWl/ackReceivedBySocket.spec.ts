import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {DependenciesWl} from "@/app/store/appStateWl";
import {FakeCommentGatewayWl} from "@/app/adapters/secondary/gateways/fake/fakeCommentGatewayWl";
import {ackListenerFactory, onCommentCreatedAck} from "@/app/contextWL/commentWl/ackReceivedBySocket";
import {commandKinds} from "@/app/contextWL/outboxWl/outbox.type";
import {
    addOptimisticCreated,
    enqueueCommitted,
    outboxProcessOnce
} from "@/app/contextWL/commentWl/commentCreateWlUseCase";
import {moderationTypes} from "@/app/contextWL/commentWl/type/commentWl.type";

describe('On ack received from server : ', () => {
    let store: ReduxStoreWl
    let dependencies: DependenciesWl
    let commentGateway: FakeCommentGatewayWl

    beforeEach(() => {
        commentGateway = new FakeCommentGatewayWl()
    })

    it('should, when ack received, create a reconcile and dropCommited ',() => {
        return new Promise(async (resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualOutbox(),
                resolve,
                reject,
            );
            store.dispatch(enqueueCommitted(outboxRecord))
            store.dispatch(addOptimisticCreated({entity: commentEntity}))
            store.dispatch(outboxProcessOnce())
            store.dispatch(onCommentCreatedAck({
                commandId:"cmd_aaa111",
                tempId:"cmt_tmp_aaa111",
                server:{
                    id:"obx_0001",
                    createdAt:"2025-10-10T07:00:01.000Z",
                    version:0,
                }
            }))
            expect(store.getState().oState.queue.length).toEqual(1);
            //expect(store.getState().oState.byId["obx_0001"]).toBeDefined()
            //expect(store.getState().oState.byCommandId["cmd_aaa111"]).toBeDefined()
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids.length).toEqual(1)
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids[0]).toEqual("cmt_tmp_aaa111")
            await flush()
        })
    });

    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    function expectActualOutbox() {
        expect(store.getState().oState.queue.length).toEqual(1);
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
        return ackListenerFactory({
            gateways: {
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
            }
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