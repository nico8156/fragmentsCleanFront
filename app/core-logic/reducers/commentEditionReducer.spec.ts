import {commentEditionReducer, initialEditionState} from "@/app/core-logic/reducers/commentEditionReducer";
import {
    commentEditRequested,
    commentEditValidated
} from "@/app/core-logic/use-cases/comment/comment-update/submitCommentEdit";
import {AppState} from "@/app/store/appState";
import {FakeCommentGateway} from "@/app/adapters/secondary/gateways/fakeCommentGateway";

describe("On comment updated, ", () => {
    let store: AppState;
    let commentGateway: FakeCommentGateway;

    beforeEach(() => {
        commentGateway = new FakeCommentGateway();
    })
    it("should update the comment when valid edited comment", () => {
        const next = commentEditionReducer(
            initialEditionState,
            commentEditRequested({ editorId: "u1", commentId: "c1", newContent: "x" }),
        );

        expect(next.data).toEqual({ editorId: "u1", commentId: "c1", newContent: "x" });
        expect(next.validation).toBeNull();
        expect(next.error).toBeNull();
    });

    it("should change ", () => {
        const next = commentEditionReducer(
            initialEditionState,
            commentEditValidated({
                status: false,
                reason: "NOT_AUTHOR",
                request: { editorId: "u2", commentId: "c1", newContent: "x" },
            }),
        );

        expect(next.validation?.status).toBe(false);
        expect(next.error).toBe("NOT_AUTHOR");
    });

    it("aucune erreur si validation OK", () => {
        const next = commentEditionReducer(
            initialEditionState,
            commentEditValidated({
                status: true,
                request: { editorId: "u1", commentId: "c1", newContent: "x" },
            }),
        );

        expect(next.validation?.status).toBe(true);
        expect(next.error).toBeNull();
    });
});
