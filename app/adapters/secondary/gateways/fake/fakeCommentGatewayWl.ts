import {CommentGatewayWl} from "@/app/core-logic/gateways/commentGatewayWl";

export class FakeCommentGatewayWl implements CommentGatewayWl{
    create({ commandId, targetId, parentId, body }: { commandId: string; targetId: string; parentId: string; body: string; }): Promise<void> {
        return Promise.resolve();
    }

}
