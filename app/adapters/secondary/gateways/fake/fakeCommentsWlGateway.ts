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

    async list(params: { targetId: string; cursor: string; limit: number; signal: AbortSignal; }): Promise<{ targetId: string; op: Op; items: CommentEntity[]; nextCursor?: string | undefined; prevCursor?: string | undefined; serverTime?: string | undefined;}> {
        return this.nextCommentsResponse!;
    }
    async create({ commandId, targetId, parentId, body }: { commandId: string; targetId: string; parentId?: string; body: string; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
}