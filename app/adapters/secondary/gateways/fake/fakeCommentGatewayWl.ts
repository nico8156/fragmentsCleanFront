import {CommentGatewayWl} from "@/app/core-logic/gateways/commentGatewayWl";

export class FakeCommentGatewayWl implements CommentGatewayWl{
    public willFailCode: boolean = false;

    create({ commandId, targetId, parentId, body }: { commandId: string; targetId: string; parentId: string; body: string; }): Promise<void> {
        if (this.willFailCode) throw new Error("error from server");
        return Promise.resolve();
    }
}
