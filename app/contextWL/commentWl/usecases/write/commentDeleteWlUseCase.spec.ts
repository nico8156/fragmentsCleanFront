import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { moderationTypes, opTypes } from "@/app/contextWL/commentWl/type/commentWl.type";
import {
    commentDeleteUseCaseFactory,
    uiCommentDeleteRequested
} from "@/app/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";
import {commentsRetrieved} from "@/app/contextWL/commentWl/usecases/read/commentRetrieval";
import {commandKinds} from "@/app/contextWL/outboxWl/outbox.type";

describe("On comment delete button pressed :", () => {
    let store: ReduxStoreWl;

    beforeEach(() => {

    });

    it("should apply optimistic tombstone and enqueue delete command", () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualCommentAndOutbox(),
                resolve,
                reject,
            );
            store.dispatch(commentsRetrieved({
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
            store.dispatch(uiCommentDeleteRequested({ commentId: "cmt_0001" }));
        })

    });

    function expectActualCommentAndOutbox() {
        //store.dispatch(uiCommentDeleteRequested({ commentId: "cmt_0001" }));

        const s = store.getState();

        // 1) Optimistic tombstone sur l’entité
        const c = s.cState.entities.entities["cmt_0001"];
        expect(c).toBeDefined();
        expect(c.deletedAt).toBe("2025-10-10T07:00:02.000Z"); // horodatage client
        expect(c.optimistic).toBe(true);
        expect(c.moderation).toBe(moderationTypes.SOFT_DELETED);

        // 2) Outbox : une entrée en "queued" avec undo prêt
        const obxId = "obx_del_0001"; // généré par helpers.getCommandIdForTests()
        const rec = s.oState.byId[obxId];
        expect(rec).toBeDefined();
        expect(s.oState.queue).toContain(obxId);

        // commande
        expect(rec.item.command.kind).toBe(commandKinds.CommentDelete);
        expect(rec.item.command.commentId).toBe("cmt_0001");
        expect(typeof rec.item.command.commandId).toBe("string"); // on ne fige pas la valeur exacte ici

        // undo (pour rollback en cas d'échec)
        expect(rec.item.undo.prevBody).toBe("Excellent flat white, ambiance au top.");
        expect(rec.item.undo.prevVersion).toBe(1);

        // statut
        expect(rec.status).toBe("queued");

        // 3) La vue par target conserve l’ID (tombstone)
        const viewIds = s.cState.byTarget["cafe_fragments_rennes"].ids;
        expect(viewIds).toContain("cmt_0001"); // on garde l’ID pour la cohérence des threads
    }

    function createReduxStoreWithListener(
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: () => void,
    ) {
        return initReduxStoreWl({
            dependencies:{
            },
            listeners:[
                createOncdListener(doExpectations, resolve, reject),
            ]
        })
    }
    const createOncdListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    )=>{
        return commentDeleteUseCaseFactory({
            gateways: {
            },
            helpers: {
                nowIso: () => "2025-10-10T07:00:02.000Z",
                currentUserId: () => "testUser",
                getCommentIdForTests: () => "cmt_tmp_Yffc7N3rOvXUYWMCLZnGT",
                getCommandIdForTests: () => "obx_del_0001"
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
});
