import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeCommentGateway} from "@/app/adapters/secondary/gateways/fakeCommentGateway";
import {createComment} from "@/app/core-logic/use-cases/comment/comment-creation/createComment";
import {Comment} from "@/app/store/appState";

describe('Comment creation', () => {
    let store: ReduxStore;
    let commentGateway: FakeCommentGateway;

    beforeEach(() => {
        commentGateway = new FakeCommentGateway();
        store = initReduxStore({gateways: {commentGateway}});
    })
    it("should create a comment when comment a comment is valid", async () => {
        commentGateway.nextComment = aComment;
        await store.dispatch(createComment("u1", "c3", "un commentaire"));
        expect(store.getState().commentRetrieval).toEqual(
            [...aComment, {id: "c3", text: "un commentaire"}]
        )
    })
    it("should not create a comment when comment is invalid, user invalid", async () => {
        await store.dispatch(createComment("u21", "c1", "un commentaire"));
        expect(store.getState().commentRetrieval).toEqual({})
    })
    it("should not create a comment when comment is invalid, content invalid", async () => {
        await store.dispatch(createComment("u1", "c1", ""));
    })

    const aComment: Comment[] = [
        {id:"c1", text:"un"}, {id: "c2", text:"deux"}
    ]

});