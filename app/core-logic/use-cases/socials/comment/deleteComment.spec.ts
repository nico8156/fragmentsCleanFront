import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeCommentGateway} from "@/app/adapters/secondary/gateways/fakeCommentGateway";
import {Comment} from "@/app/store/appState";
import {retrieveComment} from "@/app/core-logic/use-cases/socials/comment/retrieveComment";
import {deleteComment} from "@/app/core-logic/use-cases/socials/comment/deleteComment";

describe('On Delete Comment', () => {

    let store: ReduxStore;
    let commentGateway: FakeCommentGateway;

    beforeEach(() => {
        commentGateway = new FakeCommentGateway();
        store = initReduxStore({gateways: {commentGateway}});
    })

    it('should delete a comment', async () => {
        commentGateway.nextComment = aComment;
        await store.dispatch(retrieveComment());
        await store.dispatch(deleteComment("1"))
        expect(store.getState().commentRetrieval.data.length).toEqual(0);
        expect(store.getState().commentRetrieval.data).toEqual([]);
    });
    it('should delete a comment if deletion confirmed', async () => {

    })

    const aComment : Comment[] = [{id: "1", text: "un commentaire"}];
})