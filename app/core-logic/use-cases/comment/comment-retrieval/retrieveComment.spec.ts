import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeCommentGateway} from "@/app/adapters/secondary/gateways/fakeCommentGateway";
import {AppState, Comment} from "@/app/store/appState";
import {retrieveComment} from "@/app/core-logic/use-cases/comment/comment-retrieval/retrieveComment";

describe('On comment retrieval : ', () => {
    let store: ReduxStore;
    let commentGateway: FakeCommentGateway;
    beforeEach(() => {
        commentGateway = new FakeCommentGateway();
        store = initReduxStore({gateways: {commentGateway}});
    });
    it("before retrieving comment, no comment should be available", () => {
        expect(store.getState().commentRetrieval).toEqual<
            AppState["commentRetrieval"]
        >({data: []});
    })
    it("should retrieve all comment", async () => {
        commentGateway.nextComment = aComment;
        await store.dispatch(retrieveComment());
        expect(store.getState().commentRetrieval).toEqual<
            AppState["commentRetrieval"]
        >({data: aComment});
    })

    const aComment: Comment[] = [
        {id : "1", text : "un commentaire"},
        {id : "2", text : "un autre commentaire"},
    ];
})