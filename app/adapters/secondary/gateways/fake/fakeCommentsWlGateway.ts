import { nanoid } from "@reduxjs/toolkit";
import {
    CommentEntity,
    Op,
    opTypes,
    moderationTypes,
} from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import { syncEventsReceived } from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

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

        console.log("[FAKE_COMMENTS] init with seed", {
            targets: Array.from(this.commentsByTarget.keys()),
            versionCounter: this.versionCounter,
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
        console.log("[FAKE_COMMENTS] setAckDispatcher");
        this.ackDispatcher = dispatcher;
    }

    setCurrentUserIdGetter(getter: () => string) {
        console.log("[FAKE_COMMENTS] setCurrentUserIdGetter");
        this.currentUserIdGetter = getter;
    }

    private getCurrentUserId() {
        const id = this.currentUserIdGetter?.() ?? "anonymous";
        // log léger, utile en debug
        console.log("[FAKE_COMMENTS] getCurrentUserId ->", id);
        return id;
    }

    private ensureComments(targetId: string) {
        if (!this.commentsByTarget.has(targetId)) {
            console.log("[FAKE_COMMENTS] ensureComments: init empty collection for", targetId);
            this.commentsByTarget.set(targetId, []);
        }
        return this.commentsByTarget.get(targetId)!;
    }

    private cloneComments(targetId: string) {
        const cloned = this.ensureComments(targetId).map((comment) => ({ ...comment }));
        console.log("[FAKE_COMMENTS] cloneComments", {
            targetId,
            count: cloned.length,
        });
        return cloned;
    }

    private randomAckDelayMs() {
        const delay = 2000 + Math.floor(Math.random() * 2001); // 2000ms → 4000ms
        console.log("[FAKE_COMMENTS] randomAckDelayMs ->", delay);
        return delay;
    }

    private scheduleAck(pending: PendingCreate) {
        const delay = this.randomAckDelayMs();
        console.log("[FAKE_COMMENTS] scheduleAck (create)", {
            commandId: pending.commandId,
            tempId: pending.tempId,
            targetId: pending.targetId,
            delay,
        });

        setTimeout(() => {
            const record = this.pendingCreates.get(pending.commandId);
            if (!record) {
                console.log("[FAKE_COMMENTS] scheduleAck: pending command not found, abort", pending.commandId);
                return;
            }
            this.pendingCreates.delete(pending.commandId);

            const serverId = `cmt_srv_${nanoid()}`;
            const createdAt = new Date().toISOString();
            const version = ++this.versionCounter;

            console.log("[FAKE_COMMENTS] scheduleAck create -> applying server state", {
                serverId,
                targetId: record.targetId,
                version,
                createdAt,
            });

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
                const evt: SyncEvent = {
                    id: `evt_${nanoid()}`,
                    happenedAt: parseToISODate(createdAt),
                    type: "comment.createdAck",
                    payload: {
                        commandId: record.commandId,
                        tempId: record.tempId,
                        server: {
                            id: newComment.id,
                            createdAt: newComment.createdAt,
                            version: newComment.version,
                        },
                    },
                };

                console.log("[FAKE_COMMENTS] scheduleAck: dispatch syncEventsReceived(comment.createdAck)", {
                    eventId: evt.id,
                    commandId: record.commandId,
                    tempId: record.tempId,
                });

                this.ackDispatcher(syncEventsReceived([evt]));
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
        const { commandId, commentId, editedAt, version, body } = params;
        const delay = this.randomAckDelayMs();

        console.log("[FAKE_COMMENTS] scheduleUpdateAck", {
            commandId,
            commentId,
            editedAt,
            version,
            delay,
        });

        setTimeout(() => {
            if (!this.ackDispatcher) {
                console.log("[FAKE_COMMENTS] scheduleUpdateAck: no ackDispatcher, abort");
                return;
            }

            const evt: SyncEvent = {
                id: `evt_${nanoid()}`,
                happenedAt: parseToISODate(editedAt),
                type: "comment.updatedAck",
                payload: {
                    commandId,
                    commentId,
                    server: {
                        version,
                        editedAt,
                        body,
                    },
                },
            };

            console.log("[FAKE_COMMENTS] scheduleUpdateAck: dispatch syncEventsReceived(comment.updatedAck)", {
                eventId: evt.id,
                commandId,
                commentId,
            });

            this.ackDispatcher(syncEventsReceived([evt]));
        }, delay);
    }

    private scheduleDeleteAck(params: {
        commandId: string;
        commentId: string;
        deletedAt: string;
        version: number;
    }) {
        const { commandId, commentId, deletedAt, version } = params;
        const delay = this.randomAckDelayMs();

        console.log("[FAKE_COMMENTS] scheduleDeleteAck", {
            commandId,
            commentId,
            deletedAt,
            version,
            delay,
        });

        setTimeout(() => {
            if (!this.ackDispatcher) {
                console.log("[FAKE_COMMENTS] scheduleDeleteAck: no ackDispatcher, abort");
                return;
            }

            const evt: SyncEvent = {
                id: `evt_${nanoid()}`,
                happenedAt: parseToISODate(deletedAt),
                type: "comment.deletedAck",
                payload: {
                    commandId,
                    commentId,
                    server: {
                        deletedAt,
                        version,
                    },
                },
            };

            console.log("[FAKE_COMMENTS] scheduleDeleteAck: dispatch syncEventsReceived(comment.deletedAck)", {
                eventId: evt.id,
                commandId,
                commentId,
            });

            this.ackDispatcher(syncEventsReceived([evt]));
        }, delay);
    }

    async list({
                   targetId,
               }: {
        targetId: string;
        cursor: string;
        limit: number;
        signal: AbortSignal;
    }): Promise<{
        targetId: string;
        op: Op;
        items: CommentEntity[];
        nextCursor?: string | undefined;
        prevCursor?: string | undefined;
        serverTime?: string | undefined;
    }> {
        console.log("[FAKE_COMMENTS] list", { targetId, willFail: this.willFail });

        if (this.willFail) {
            console.log("[FAKE_COMMENTS] list: throwing fake error");
            throw new Error("Fake error from fakeCommentsWlGateway");
        }
        if (this.nextCommentsResponse) {
            console.log("[FAKE_COMMENTS] list: returning nextCommentsResponse override");
            return this.nextCommentsResponse;
        }

        const items = this.cloneComments(targetId);
        const response = {
            targetId,
            op: opTypes.RETRIEVE,
            items,
            serverTime: new Date().toISOString(),
        };

        console.log("[FAKE_COMMENTS] list: returning response", {
            count: items.length,
        });

        return response;
    }

    async create({
                     commandId,
                     targetId,
                     parentId,
                     body,
                     tempId,
                 }: {
        commandId: string;
        targetId: string;
        parentId?: string | null;
        body: string;
        tempId?: string;
    }): Promise<void> {
        console.log("[FAKE_COMMENTS] create", {
            commandId,
            targetId,
            parentId,
            hasTempId: !!tempId,
            willFail: this.willFail,
        });

        if (this.willFail) {
            console.log("[FAKE_COMMENTS] create: throwing fake error");
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

        console.log("[FAKE_COMMENTS] create: pending stored, scheduling ACK", {
            commandId,
            targetId,
        });

        this.scheduleAck(pending);
        return Promise.resolve();
    }

    async update({
                     commandId,
                     commentId,
                     body,
                     editedAt,
                 }: {
        commandId: string;
        commentId: string;
        body: string;
        editedAt: string;
    }): Promise<void> {
        console.log("[FAKE_COMMENTS] update", {
            commandId,
            commentId,
            editedAt,
            willFail: this.willFail,
        });

        if (this.willFail) {
            console.log("[FAKE_COMMENTS] update: throwing fake error");
            throw new Error("Fake error from fakeCommentsWlGateway");
        }

        const found = this.findCommentById(commentId);
        if (!found) {
            console.log("[FAKE_COMMENTS] update: comment not found", { commentId });
            return;
        }

        const { collection, index } = found;
        const existing = collection[index];

        const version = ++this.versionCounter;

        const updatedComment: CommentEntity = {
            ...existing,
            body,
            editedAt,
            version,
        };

        collection[index] = updatedComment;

        console.log("[FAKE_COMMENTS] update: updated local comment", {
            commentId: updatedComment.id,
            version,
            editedAt,
        });

        this.scheduleUpdateAck({
            commandId,
            commentId: updatedComment.id,
            editedAt,
            version,
            body: updatedComment.body,
        });
        return Promise.resolve();
    }

    async delete({
                     commandId,
                     commentId,
                     deletedAt,
                 }: {
        commandId: string;
        commentId: string;
        deletedAt: string;
    }): Promise<void> {
        console.log("[FAKE_COMMENTS] delete", {
            commandId,
            commentId,
            deletedAt,
            willFail: this.willFail,
        });

        if (this.willFail) {
            console.log("[FAKE_COMMENTS] delete: throwing fake error");
            throw new Error("Fake error from fakeCommentsWlGateway");
        }

        const found = this.findCommentById(commentId);
        if (!found) {
            console.log("[FAKE_COMMENTS] delete: comment not found", { commentId });
            return;
        }

        const { targetId, collection, index } = found;
        const toDelete = collection[index];

        if (toDelete.parentId) {
            const parent = collection.find((c) => c.id === toDelete.parentId);
            if (parent) {
                parent.replyCount = Math.max(0, (parent.replyCount ?? 0) - 1);
            }
        }

        collection.splice(index, 1);

        console.log("[FAKE_COMMENTS] delete: removed from local store", {
            targetId,
            commentId: toDelete.id,
            version: toDelete.version,
        });

        this.scheduleDeleteAck({
            commandId,
            commentId: toDelete.id,
            deletedAt,
            version: toDelete.version,
        });

        return Promise.resolve();
    }
}
