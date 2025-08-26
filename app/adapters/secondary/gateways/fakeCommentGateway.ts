import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {Comment} from "@/app/store/appState";

export class FakeCommentGateway implements CommentGateway{
    nextComment: Comment[] | null = null;

    async retrieveComment(): Promise<Comment[]> {
        return this.nextComment!;
    }
}
