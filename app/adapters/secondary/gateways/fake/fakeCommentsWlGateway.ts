import { CommentEntity, Op, opTypes, moderationTypes } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";

const seedComments: Record<string, CommentEntity[]> = {
    "07dae867-1273-4d0f-b1dd-f206b290626b": [
        {
            id: "cmt_seed_columbus_1",
            targetId: "07dae867-1273-4d0f-b1dd-f206b290626b",
            body: "Latte très soyeux et équipe adorable, parfait pour une pause douce.",
            authorId: "Camille",
            createdAt: "2024-02-18T09:15:00.000Z",
            likeCount: 8,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 1,
        },
        {
            id: "cmt_seed_columbus_2",
            targetId: "07dae867-1273-4d0f-b1dd-f206b290626b",
            body: "Le cookie chocolat-noisette vaut clairement le détour !",
            authorId: "Yanis",
            createdAt: "2024-02-20T15:42:00.000Z",
            likeCount: 3,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 1,
        },
    ],
    "2d6a1ddf-da7f-4136-b855-5a993de80c4d": [
        {
            id: "cmt_seed_repair_1",
            targetId: "2d6a1ddf-da7f-4136-b855-5a993de80c4d",
            body: "Ambiance conviviale, les bénévoles prennent le temps d'échanger.",
            authorId: "Sophie",
            createdAt: "2024-03-01T10:05:00.000Z",
            likeCount: 5,
            replyCount: 1,
            moderation: moderationTypes.PUBLISHED,
            version: 2,
        },
        {
            id: "cmt_seed_repair_2",
            targetId: "2d6a1ddf-da7f-4136-b855-5a993de80c4d",
            parentId: "cmt_seed_repair_1",
            body: "Et leurs filtres V60 sont toujours irréprochables !",
            authorId: "Louis",
            createdAt: "2024-03-02T08:22:00.000Z",
            likeCount: 2,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 1,
        },
    ],
    "30a291bb-7c35-44fa-aa57-b1861920b5de": [
        {
            id: "cmt_seed_mokka_1",
            targetId: "30a291bb-7c35-44fa-aa57-b1861920b5de",
            body: "Expresso bien équilibré, acidité marquée et finale chocolatée.",
            authorId: "Anaïs",
            createdAt: "2024-01-28T14:10:00.000Z",
            likeCount: 11,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 3,
        },
    ],
};

export class FakeCommentsWlGateway implements CommentsWlGateway {
    nextCommentsResponse: {
        targetId: string;
        op: Op;
        items: CommentEntity[];
        nextCursor?: string | undefined;
        prevCursor?: string | undefined;
        serverTime?: string | undefined;
    } | null = null;

    willFail = false;

    async list({ targetId }: { targetId: string; cursor: string; limit: number; signal: AbortSignal }): Promise<{
        targetId: string;
        op: Op;
        items: CommentEntity[];
        nextCursor?: string | undefined;
        prevCursor?: string | undefined;
        serverTime?: string | undefined;
    }> {
        if (this.willFail) {
            throw new Error("Fake error from fakeCommentsWlGateway");
        }
        if (this.nextCommentsResponse) {
            return this.nextCommentsResponse;
        }

        const items = seedComments[targetId] ?? [];
        return {
            targetId,
            op: opTypes.RETRIEVE,
            items,
            serverTime: new Date().toISOString(),
        };
    }

    async create({ commandId, targetId, parentId, body }: { commandId: string; targetId: string; parentId?: string | null; body: string }): Promise<void> {
        void commandId;
        void targetId;
        void parentId;
        void body;
        return Promise.resolve();
    }

    async update({ commandId, commentId, body, updatedAt }: { commandId: string; commentId: string; body: string; updatedAt: string }): Promise<void> {
        void commandId;
        void commentId;
        void body;
        void updatedAt;
        return Promise.resolve();
    }

    async delete({ commandId, commentId, deletedAt }: { commandId: string; commentId: string; deletedAt: string }): Promise<void> {
        void commandId;
        void commentId;
        void deletedAt;
        return Promise.resolve();
    }
}
