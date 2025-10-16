import {
    addOptimisticCreated,
    enqueueCommitted
} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {commandKinds} from "@/app/contextWL/outboxWl/outbox.type";
import {moderationTypes} from "@/app/contextWL/commentWl/type/commentWl.type";
import {commentUpdateWlUseCase, cuAction} from "@/app/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";

describe('On comment update button pressed : ', () => {
    let store: ReduxStoreWl

    it('should add optimistic updated comment and new command', () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualCommentAndOutbox(),
                resolve,
                reject,
            );
            //simule enqueue + optimistic + test du body
            store.dispatch(enqueueCommitted(outboxRecord))
            store.dispatch(addOptimisticCreated({entity: commentEntity}))
            expect(store.getState().oState.byId["obx_0001"]).toBeDefined()
            expect(store.getState().cState.entities.entities["cmt_tmp_aaa111"].body).toEqual("Excellent flat white, ambiance au top.")
            //on modifie le commentaire
            store.dispatch(cuAction({
                commentId:"cmt_tmp_aaa111",
                newBody:"un commentaire modifié",
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
                createOnUpdateCommentUseCaseListener(doExpectations, resolve, reject),
            ]
        })
    }
    const createOnUpdateCommentUseCaseListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    ) => {
        return commentUpdateWlUseCase({
            gateways: {
            },
            helpers: {
                getCommandIdForTests: () => "cmd_aaa123",
                nowIso: () => "2025-10-10T07:00:02.000Z"
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
    function expectActualCommentAndOutbox() {
        // et on vérifie que le body a été modifié
        expect(store.getState().oState.queue).toContain("cmd_aaa123")
        expect(store.getState().oState.byId["cmd_aaa123"]).toBeDefined()
        expect(store.getState().cState.entities.entities["cmt_tmp_aaa111"].body).toEqual("un commentaire modifié")
        expect(store.getState().cState.entities.entities["cmt_tmp_aaa111"].editedAt)
            .toBe("2025-10-10T07:00:02.000Z");
        expect(store.getState().cState.entities.entities["cmt_tmp_aaa111"].optimistic)
            .toBe(true);
        expect(store.getState().oState.byId["cmd_aaa123"].item.undo.prevBody).toBe("Excellent flat white, ambiance au top.");
        // la command est en queue, le body est modifié
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