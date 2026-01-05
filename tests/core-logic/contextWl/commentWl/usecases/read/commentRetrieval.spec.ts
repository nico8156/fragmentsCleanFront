import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";

import {
    type CommentEntity,
    type ListCommentsResult,
    loadingStates,
    moderationTypes,
    opTypes,
} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

import { commentRetrieval } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { FakeCommentsWlGateway } from "@/tests/core-logic/fakes/FakeCommentsWlGateway";

describe("Comments retrieval", () => {
    let store: ReduxStoreWl;
    let comments: FakeCommentsWlGateway;

    beforeEach(() => {
        comments = new FakeCommentsWlGateway();
        store = initReduxStoreWl({
            dependencies: {
                gateways: {
                    comments,
                },
            },
        });
    });

    afterEach(() => {
        comments.willFailList = false;
        comments.nextListResponse = {
            items: [],
            nextCursor: undefined,
            prevCursor: undefined,
            serverTime: undefined,
        } as any;
    });

    it("initial: no comments, no view", () => {
        const s: any = store.getState().cState;
        expect(Object.keys(s.byTarget)).toHaveLength(0);
        expect(s.entities.ids).toEqual([]);
        expect(s.entities.entities).toEqual({});
    });

    it("happy path: retrieves comments, creates view, sets SUCCESS + anchor", async () => {
        comments.nextListResponse = aResponseFromServer;

        const p = store.dispatch(
            commentRetrieval({
                targetId: "post_42",
                op: opTypes.RETRIEVE,
                cursor: "cursor_0001",
                limit: 20,
            }) as any,
        );

        // pending visible
        const pendingView: any = store.getState().cState.byTarget["post_42"];
        expect(pendingView).toBeDefined();
        expect(pendingView.loading).toBe(loadingStates.PENDING);

        await p;

        const { byTarget, entities }: any = store.getState().cState;

        // entities: upsert tout (post_42 + post_99)
        expect(entities.ids.length).toBe(8);
        expect(entities.entities["cmt_0001"]).toBeDefined();

        // view: uniquement post_42
        expect(byTarget["post_42"]).toBeDefined();
        expect(byTarget["post_42"].ids.length).toBe(5);
        expect(byTarget["post_42"].ids.every((id: string) => entities.entities[id].targetId === "post_42")).toBe(true);

        expect(byTarget["post_42"].loading).toBe(loadingStates.SUCCESS);
        expect(byTarget["post_42"].error).toBeUndefined();
        expect(byTarget["post_42"].anchor).toBe("2025-10-10T07:00:01.000Z");

        // observabilité gateway
        expect(comments.listCalls.length).toBe(1);
        expect(comments.listCalls[0]).toMatchObject({
            targetId: "post_42",
            cursor: "cursor_0001",
            limit: 20,
            op: opTypes.RETRIEVE,
        });
        expect(comments.listCalls[0].abortedAtCall).toBe(false);
    });

    it("error: sets view ERROR + message, keeps entities empty", async () => {
        comments.willFailList = true;

        await store.dispatch(
            commentRetrieval({
                targetId: "post_42",
                op: opTypes.RETRIEVE,
                cursor: "cursor_0001",
                limit: 20,
            }) as any,
        );

        const s: any = store.getState().cState;

        expect(s.entities.ids.length).toBe(0);
        expect(s.byTarget["post_42"]).toBeDefined();
        expect(s.byTarget["post_42"].ids.length).toBe(0);
        expect(s.byTarget["post_42"].loading).toBe(loadingStates.ERROR);
        expect(s.byTarget["post_42"].error).toBe("comments list failed"); // <= failMessageList
    });

    // ---------------- fixtures ----------------

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
            version: 3,
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
            version: 1,
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
            version: 2,
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
            version: 1,
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
            version: 1,
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
            version: 4,
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
            version: 1,
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
            version: 1,
        },
    ];

    const aResponseFromServer: ListCommentsResult = {
        targetId: "post_42",
        op: opTypes.RETRIEVE,
        items: commentListEntity,
        nextCursor: undefined,
        prevCursor: undefined,
        serverTime: "2025-10-10T07:00:01.000Z",
    };
});
