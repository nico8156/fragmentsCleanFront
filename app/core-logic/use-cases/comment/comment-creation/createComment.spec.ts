import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeCommentGateway} from "@/app/adapters/secondary/gateways/fakeCommentGateway";
import {createComment} from "@/app/core-logic/use-cases/comment/comment-creation/createComment";
import {Comment} from "@/app/store/appState";
import {retrieveComment} from "@/app/core-logic/use-cases/comment/comment-retrieval/retrieveComment";

describe('On comment creation', () => {
    let store: ReduxStore;
    let commentGateway: FakeCommentGateway;

    beforeEach(() => {
        commentGateway = new FakeCommentGateway();
        store = initReduxStore({gateways: {commentGateway}});
    })
    it("should create the first comment when comment a comment is valid and list of comment is empty", async () => {
        await store.dispatch(createComment("u1", "c3", "un commentaire"));
        expect(store.getState().commentRetrieval.data).toEqual(
            [{id: "c3", text: "un commentaire"}]
        )
        expect(store.getState().commentRetrieval.data.length).toEqual(1);
    })
    it("should create the comment when comment a comment is valid and add it to an existing list of comment", async () => {
        commentGateway.nextComment = aComment;
        await store.dispatch(retrieveComment());
        await store.dispatch(createComment("u1", "c3", "un commentaire"));
        expect(store.getState().commentRetrieval.data.length).toEqual(3);
        expect(store.getState().commentRetrieval.data).toEqual([...aComment, {id: "c3", text: "un commentaire"}]);
    })
    it("should NOT create a comment when comment's content is empty", async () => {
        await store.dispatch(createComment("u1", "c1", ""));
        expect(store.getState().commentRetrieval.data.length).toEqual(0);
        expect(store.getState().commentRetrieval.data).toEqual([]);
    })
    const aComment: Comment[] = [{id:"c1", text:"un"}, {id: "c2", text:"deux"}];
});