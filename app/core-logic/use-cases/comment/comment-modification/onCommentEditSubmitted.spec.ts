// canEditComment.spec.ts
import { canEditComment } from "./canEditComment";

describe("canEditComment", () => {
    it("OK quand editor est l'auteur et contenu non vide", () => {
        expect(canEditComment({ editorId:"u1", authorId:"u1", newContent:"ok" }))
            .toEqual({ status:true });
    });

    it("refuse NON AUTEUR", () => {
        expect(canEditComment({ editorId:"u2", authorId:"u1", newContent:"ok" }))
            .toEqual({ status:false, reason:"NOT_AUTHOR" });
    });

    it("refuse CONTENU VIDE", () => {
        expect(canEditComment({ editorId:"u1", authorId:"u1", newContent:"   " }))
            .toEqual({ status:false, reason:"EMPTY_CONTENT" });
    });
});
