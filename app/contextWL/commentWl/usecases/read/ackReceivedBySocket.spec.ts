import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {
    ackListenerFactory,
    onCommentCreatedAck, onCommentDeletedAck,
    onCommentUpdatedAck
} from "@/app/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import {commandKinds} from "@/app/contextWL/outboxWl/outbox.type";
import {addOptimisticCreated, enqueueCommitted,} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {moderationTypes, opTypes} from "@/app/contextWL/commentWl/type/commentWl.type";
import {commentsRetrieved} from "@/app/contextWL/commentWl/usecases/read/commentRetrieval";

const flush = () => new Promise<void>(r => setTimeout(r, 0));

describe('On ack received from server : ', () => {

    const flush = () => new Promise<void>(r => setTimeout(r, 0));
    let store: ReduxStoreWl

    it('should, on create comment, when ack received, create a reconcile and dropCommited ', () => {
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
    it('should, on update comment, when ack received, create a reconcile and dropCommited ', () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => {
                    expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids.length).toEqual(1)
                    expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids[0]).toEqual("cmt_tmp_aaa111")
                    expect(store.getState().cState.entities.entities["cmt_tmp_aaa111"].body).toEqual("un commentaire modifié")
                },
                resolve,
                reject,
            );
            //simule enqueue + optimistic
            store.dispatch(enqueueCommitted(outboxRecord))
            store.dispatch(addOptimisticCreated({entity: commentEntity}))
            expect(store.getState().oState.byId["obx_0001"]).toBeDefined()
            expect(store.getState().cState.byTarget["cafe_fragments_rennes"].ids.length).toEqual(1)
            expect(store.getState().oState.byCommandId["cmd_aaa111"]).toBeDefined()
            store.dispatch(onCommentUpdatedAck({
                commandId:"cmd_aaa111",
                commentId:"cmt_tmp_aaa111",
                server:{
                    body:"un commentaire modifié",
                    editedAt:"2025-10-10T07:00:01.000Z",
                    version:2,
                }
            }))
        })
    })
    it('should, on delete comment, when ack received, create a reconcile and dropCommited ', async () => {
        store = initReduxStoreWl({
            dependencies: {},
            listeners: [ackListenerFactory({
                gateways: {
                },
                helpers: {
                    nowIso: () => new Date().toISOString(),
                }
            },
                () => {}).middleware] // important: passer l'objet listener (pas .middleware si ton init le mappe déjà)
        });
        store.dispatch(
            commentsRetrieved({
                targetId: "cafe_fragments_rennes",
                op: opTypes.RETRIEVE,
                items: [
                    {
                        id: "cmt_0001",
                        targetId: "cafe_fragments_rennes",
                        body: "Excellent flat white, ambiance au top.",
                        authorId: "user_1",
                        createdAt: "2025-10-10T07:00:00.000Z",
                        likeCount: 0,
                        replyCount: 0,
                        moderation: moderationTypes.PUBLISHED,
                        version: 1,
                    },
                ],
                nextCursor: undefined,
                prevCursor: undefined,
                serverTime: "2025-10-10T07:00:01.000Z",
            }) as any
        );

        // Seed: un record outbox “delete” en attente (simulateur : already queued + byCommandId)
        store.dispatch(
            enqueueCommitted({
                id: "obx_del_0001",
                item: {
                    command: {
                        kind: commandKinds.CommentDelete,
                        commandId: "cmd_del_123",
                        commentId: "cmt_0001",
                        createdAt: "2025-10-10T07:00:02.000Z",
                    },
                    undo: {
                        kind: commandKinds.CommentDelete,
                        commentId: "cmt_0001",
                        prevBody: "Excellent flat white, ambiance au top.",
                        prevVersion: 1,
                    },
                },
                enqueuedAt: "2025-10-10T07:00:02.000Z",
            })
        );
        store.dispatch(
            onCommentDeletedAck({
                commandId: "cmd_del_123",
                commentId: "cmt_0001",
                server: {
                    deletedAt: "2025-10-10T07:05:00.000Z", // horodatage serveur
                    version: 2,
                },
            })
        );

        await flush(); // laisser le listener agir

        const s = store.getState();

        // 1) Reconcile: l’entité est tombstonée avec les infos serveur et plus optimistic
        const c = s.cState.entities.entities["cmt_0001"];
        expect(c).toBeDefined();
        expect(c.deletedAt).toBe("2025-10-10T07:05:00.000Z");
        expect(c.version).toBe(2);
        expect(c.optimistic).toBe(false);
        // (optionnel) garder/modifier moderation
        // expect(c.moderation).toBe(moderationTypes.SOFT_DELETED);

        // 2) L’ID reste bien dans la vue (tombstone visible pour la cohérence du thread)
        expect(s.cState.byTarget["cafe_fragments_rennes"].ids).toContain("cmt_0001");

        // 3) Outbox: record supprimé + mapping commandId nettoyé
        expect(s.oState.byCommandId["cmd_del_123"]).toBeUndefined();
        expect(s.oState.byId["obx_del_0001"]).toBeUndefined();
    })



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