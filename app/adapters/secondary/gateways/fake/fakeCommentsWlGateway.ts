import { Op, CommentEntity} from "@/app/contextWL/commentWl/type/commentWl.type";
import {CommentsWlGateway} from "@/app/store/appStateWl";

export class FakeCommentsWlGateway implements CommentsWlGateway {

    nextCommentsResponse : {
        targetId: string;
        op: Op;
        items: CommentEntity[];
        nextCursor?: string | undefined;
        prevCursor?: string | undefined;
        serverTime?: string | undefined;
    } | null = null;

    willFail : boolean = false;

    async list(params: { targetId: string; cursor: string; limit: number; signal: AbortSignal; }): Promise<{ targetId: string; op: Op; items: CommentEntity[]; nextCursor?: string | undefined; prevCursor?: string | undefined; serverTime?: string | undefined;}> {
        if (this.willFail) {
            throw new Error("Fake error from fakeCommentsWlGateway");
        }
        return this.nextCommentsResponse!;
    }
    async create({ commandId, targetId, parentId, body }: { commandId: string; targetId: string; parentId?: string; body: string; }): Promise<void> {
        return Promise.resolve();
    }
    async update({ commandId, commentId, body, updatedAt }: { commandId: string; commentId: string; body: string; updatedAt: string; }): Promise<void> {
        return Promise.resolve();
    }
    delete({ commandId, commentId, deletedAt }: { commandId: string; commentId: string;deletedAt:string }): Promise<void> {
        return Promise.resolve();
    }
}