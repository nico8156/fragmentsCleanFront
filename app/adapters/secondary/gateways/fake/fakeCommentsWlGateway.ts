import { nanoid } from "@reduxjs/toolkit";
import { CommentEntity, Op, opTypes, moderationTypes } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import {
    onCommentCreatedAck,
    onCommentUpdatedAck
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

const seedComments: Record<string, CommentEntity[]> = {
    "07dae867-1273-4d0f-b1dd-f206b290626b": [
        {
            id: "cmt_seed_columbus_1",
            targetId: "07dae867-1273-4d0f-b1dd-f206b290626b",
            body: "Latte très soyeux et équipe adorable, parfait pour une pause douce.",
            authorId: "camille.dupont",
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
            authorId: "yanis.benali",
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
            authorId: "sophie.nguyen",
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
            authorId: "louis.martel",
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
            authorId: "anais.morel",
            createdAt: "2024-01-28T14:10:00.000Z",
            likeCount: 11,
            replyCount: 0,
            moderation: moderationTypes.PUBLISHED,
            version: 3,
        },
    ],
};

type AckDispatcher = (action: { type: string; payload?: any }) => void;

type PendingCreate = {
    commandId: string;
    tempId?: string;
    targetId: string;
    parentId?: string;
    body: string;
    authorId: string;
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

    private readonly commentsByTarget = new Map<string, CommentEntity[]>();

    private ackDispatcher?: AckDispatcher;

    private currentUserIdGetter?: () => string;

    private readonly pendingCreates = new Map<string, PendingCreate>();

    private versionCounter = 0;

    constructor(initialSeed: Record<string, CommentEntity[]> = seedComments) {
        Object.entries(initialSeed).forEach(([targetId, comments]) => {
            const cloned = comments.map((comment) => ({ ...comment }));
            this.commentsByTarget.set(targetId, cloned);
            cloned.forEach((comment) => {
                if (comment.version > this.versionCounter) {
                    this.versionCounter = comment.version;
                }
            });
        });
    }

    private findCommentById(commentId: string): { targetId: string; collection: CommentEntity[]; index: number } | null {
        for (const [targetId, collection] of this.commentsByTarget.entries()) {
            const index = collection.findIndex((c) => c.id === commentId);
            if (index !== -1) {
                return { targetId, collection, index };
            }
        }
        return null;
    }


    setAckDispatcher(dispatcher: AckDispatcher) {
        this.ackDispatcher = dispatcher;
    }

    setCurrentUserIdGetter(getter: () => string) {
        this.currentUserIdGetter = getter;
    }

    private getCurrentUserId() {
        return this.currentUserIdGetter?.() ?? "anonymous";
    }

    private ensureComments(targetId: string) {
        if (!this.commentsByTarget.has(targetId)) {
            this.commentsByTarget.set(targetId, []);
        }
        return this.commentsByTarget.get(targetId)!;
    }

    private cloneComments(targetId: string) {
        return this.ensureComments(targetId).map((comment) => ({ ...comment }));
    }

    private randomAckDelayMs() {
        return 2000 + Math.floor(Math.random() * 2001); // 2000ms → 4000ms
    }

    private scheduleAck(pending: PendingCreate) {
        const delay = this.randomAckDelayMs();
        setTimeout(() => {
            const record = this.pendingCreates.get(pending.commandId);
            if (!record) {
                return;
            }
            this.pendingCreates.delete(pending.commandId);

            const serverId = `cmt_srv_${nanoid()}`;
            const createdAt = new Date().toISOString();
            const version = ++this.versionCounter;

            const newComment: CommentEntity = {
                id: serverId,
                targetId: record.targetId,
                parentId: record.parentId,
                body: record.body,
                authorId: record.authorId,
                createdAt,
                likeCount: 0,
                replyCount: 0,
                moderation: moderationTypes.PUBLISHED,
                version,
            };

            const collection = this.ensureComments(record.targetId);
            collection.push(newComment);
            collection.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

            if (record.parentId) {
                const parent = collection.find((comment) => comment.id === record.parentId);
                if (parent) {
                    parent.replyCount = Math.max(parent.replyCount + 1, 1);
                }
            }

            if (record.tempId && this.ackDispatcher) {
                this.ackDispatcher(
                    onCommentCreatedAck({
                        commandId: record.commandId,
                        tempId: record.tempId,
                        server: {
                            id: newComment.id,
                            createdAt: newComment.createdAt,
                            version: newComment.version,
                        },
                    }),
                );
            }
        }, delay);
    }

    private scheduleUpdateAck(params: {
        commandId: string;
        commentId: string;
        editedAt: string;
        version: number;
        body: string;
    }) {
        const { commandId, commentId, editedAt, version , body} = params;
        const delay = this.randomAckDelayMs();

        setTimeout(() => {
            if (!this.ackDispatcher) return;

            this.ackDispatcher(
                onCommentUpdatedAck({
                    commandId,
                    commentId,
                    server: {
                        version,
                        editedAt,
                        body
                    },
                }),
            );
        }, delay);
    }



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

        const items = this.cloneComments(targetId);
        return {
            targetId,
            op: opTypes.RETRIEVE,
            items,
            serverTime: new Date().toISOString(),
        };
    }

    async create({ commandId, targetId, parentId, body, tempId }: { commandId: string; targetId: string; parentId?: string | null; body: string; tempId?: string }): Promise<void> {
        if (this.willFail) {
            throw new Error("Fake error from fakeCommentsWlGateway");
        }

        const pending: PendingCreate = {
            commandId,
            tempId,
            targetId,
            parentId: parentId ?? undefined,
            body,
            authorId: this.getCurrentUserId(),
        };

        this.pendingCreates.set(commandId, pending);
        this.scheduleAck(pending);
        return Promise.resolve();
    }

    async update({ commandId, commentId, body, editedAt }: { commandId: string; commentId: string; body: string; editedAt: string }): Promise<void> {
        void commandId;
        void commentId;
        void body;
        void editedAt;
        if (this.willFail) {
            throw new Error("Fake error from fakeCommentsWlGateway");
        }

        const found = this.findCommentById(commentId);
        if (!found) {
            // Tu peux throw si tu veux tester les erreurs réseau/serveur
            return;
        }

        const { collection, index } = found;
        const existing = collection[index];

        const version = ++this.versionCounter;

        const updatedComment: CommentEntity = {
            ...existing,
            body,
            // si CommentEntity ne déclare pas updatedAt, enlève cette ligne :
            editedAt,
            version,
        };

        collection[index] = updatedComment;

        // Simule l’ACK serveur (comme si ça venait du socket)
        this.scheduleUpdateAck({
            commandId,
            commentId: updatedComment.id,
            editedAt,
            version,
            body: updatedComment.body
        });
        return Promise.resolve();
    }

    async delete({ commandId, commentId, deletedAt }: { commandId: string; commentId: string; deletedAt: string }): Promise<void> {
        void commandId;
        void commentId;
        void deletedAt;
        return Promise.resolve();
    }
}
