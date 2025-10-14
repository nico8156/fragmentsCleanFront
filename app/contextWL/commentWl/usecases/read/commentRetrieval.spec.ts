import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import {AppStateWl} from "@/app/store/appStateWl";
import {
    CommentEntity,
    ListCommentsResult,
    moderationTypes,
    opTypes
} from "@/app/contextWL/commentWl/type/commentWl.type";
import {commentRetrieval} from "@/app/contextWL/commentWl/usecases/read/commentRetrieval";

describe('On comment retrieval : ', () => {
    let store: ReduxStoreWl;
    let commentGateway: FakeCommentsWlGateway;
    beforeEach(() => {
        commentGateway = new FakeCommentsWlGateway();
        store = initReduxStoreWl({
            dependencies: {
                gateways: {
                    comments: commentGateway,
                }
            }
        });
    })
    it('should, before retrieving comment, no comment should be available ', () => {
        expect(store.getState().cState).toEqual<AppStateWl["comments"]>({"byTarget": {}, "entities": {"entities": {}, "ids": []}});
    });
    it("should retrieve comment", async () => {
        commentGateway.nextCommentsResponse = aResponseFromServer
        store.dispatch(commentRetrieval({
            targetId: "post_42",
            op: opTypes.RETRIEVE,
            cursor:"cursor_0001",
            limit:20
        }))
        expect(store.getState().cState.entities.entities["cmt_0001"]).toBeDefined()
    })

    const commentListEntity: CommentEntity[] = [
        {
            id: "cmt_0001",
            targetId: "post_42",
            body: "Premier ressenti sur ce café : acidité équilibrée, finale chocolatée.",
            authorId: "user_alice",
            createdAt: "2025-10-14T08:15:12.000Z",
            likeCount: 12,
            replyCount: 3,
            moderation: moderationTypes.PUBLISHED,
            version: 3
        },
        {
            id: "cmt_0002",
            targetId: "post_42",
            parentId: "cmt_0001",
            body: "Entièrement d’accord, extraction un poil rapide mais résultat propre.",
            authorId: "user_bob",
            createdAt: "2025-10-14T08:18:47.000Z",
            likeCount: 5,
            replyCount: 1,
            moderation: moderationTypes.PUBLISHED,
            version: 1
        },
        {
            id: "cmt_0003",
            targetId: "post_42",
            parentId: "cmt_0001",
            body: "J’ai trouvé le lait un peu trop chaud pour un flat white.",
            authorId: "user_claire",
            createdAt: "2025-10-14T08:20:03.000Z",
            editedAt: "2025-10-14T08:33:10.000Z",
            likeCount: 2,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 2
        },
        {
            id: "cmt_0004",
            targetId: "post_42",
            parentId: "cmt_0001",
            body: "Le service était très sympa aussi 😊",
            authorId: "user_diego",
            createdAt: "2025-10-14T08:22:19.000Z",
            likeCount: 4,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 1
        },
        {
            id: "cmt_0005",
            targetId: "post_42",
            parentId: "cmt_0002",
            body: "Oui, on dirait un ratio 1:2 en 23s. Perso je vise 27–30s.",
            authorId: "user_alice",
            createdAt: "2025-10-14T08:26:01.000Z",
            likeCount: 3,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 1
        },
        {
            id: "cmt_0101",
            targetId: "post_99",
            body: "La V60 du jour est dingue, notes florales et pêche.",
            authorId: "user_franco",
            createdAt: "2025-10-13T16:05:10.000Z",
            likeCount: 21,
            replyCount: 2,
            moderation: moderationTypes.PUBLISHED,
            version: 4
        },
        {
            id: "cmt_0102",
            targetId: "post_99",
            parentId: "cmt_0101",
            body: "Origine ? Éthiopie Guji ?",
            authorId: "user_gina",
            createdAt: "2025-10-13T16:07:55.000Z",
            likeCount: 6,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 1
        },
        {
            id: "cmt_0103",
            targetId: "post_99",
            parentId: "cmt_0101",
            body: "Je crois que c’est un lot lavé de Yirgacheffe.",
            authorId: "user_helena",
            createdAt: "2025-10-13T16:10:12.000Z",
            likeCount: 7,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 1
        }
    ]
    const aResponseFromServer : ListCommentsResult = {
        targetId:"post_42", op: opTypes.RETRIEVE, items: commentListEntity, nextCursor: undefined, prevCursor: undefined, serverTime: "2025-10-10T07:00:01.000Z"
    }
})