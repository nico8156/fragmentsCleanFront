import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {ackListenerFactory, onCommentCreatedAck} from "@/app/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import {commandKinds} from "@/app/contextWL/outboxWl/outbox.type";
import {addOptimisticCreated, enqueueCommitted,} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {moderationTypes} from "@/app/contextWL/commentWl/type/commentWl.type";

describe('On ack received from server : ', () => {
    let store: ReduxStoreWl

    it('should, when ack received, create a reconcile and dropCommited ', () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => {},
                resolve,
                reject,
            );
            //simule enqueue + optimistic
            store.dispatch(enqueueCommitted(outboxRecord))
            store.dispatch(addOptimisticCreated({entity: commentEntity}))
            // test if ok
            expect(store.getState().oState.byId["obx_0001"]).toBeDefined()
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids.length).toEqual(1)
            expect(store.getState().oState.byCommandId["cmd_aaa111"]).toBeDefined()

            store.dispatch(onCommentCreatedAck({
                commandId:"cmd_aaa111",
                tempId:"cmt_tmp_aaa111",
                server:{
                    id:"newIdFromServer",
                    createdAt:"2025-10-10T07:00:01.000Z",
                    version:2,
                }
            }))
            //reconcile
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids.length).toEqual(1)
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids[0]).toEqual("newIdFromServer")
            expect(store.getState().cState.entities.entities["newIdFromServer"]).toBeDefined()
            expect(store.getState().cState.entities.entities["cmt_tmp_aaa111"]).toBeUndefined()
            expect(store.getState().cState.entities.entities["newIdFromServer"].version).toEqual(2)
            expect(store.getState().cState.entities.entities["newIdFromServer"].createdAt).toEqual("2025-10-10T07:00:01.000Z")
            //dropCommited
            expect(store.getState().oState.byId["obx_0001"]).toBeUndefined()
            expect(store.getState().oState.byCommandId["cmd_aaa111"]).toBeUndefined()
        })
    });

    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    // function expectActualOutbox() {
    //     expect(store.getState().oState.queue.length).toEqual(1);
    // }
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