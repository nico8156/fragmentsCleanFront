import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeCommentGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentGateway";
import {Comment} from "@/app/store/appState";
import {retrieveComment} from "@/app/core-logic/use-cases/socials/comment/retrieveComment";
import {updateComment} from "@/app/core-logic/use-cases/socials/comment/updateComment";

describe('On update Comment', () => {
    let store: ReduxStore;
    let commentGateway: FakeCommentGateway;

    beforeEach(() => {
        commentGateway = new FakeCommentGateway();
        store = initReduxStore({gateways: {commentGateway}});
    })

    it('should update a comment', async () => {
        commentGateway.nextComment = aComment;
        await store.dispatch(retrieveComment());
        await store.dispatch(updateComment("1", "u1","un autre commentaire"));
        expect(store.getState().commentRetrieval.data).toEqual([{id: "1", text: "un autre commentaire"}]);
        expect(store.getState().commentRetrieval.data.length).toEqual(1);
    });

    const aComment:Comment[] = [{id: "1", text: "un commentaire"}];
})