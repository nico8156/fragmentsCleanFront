import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { commentsRetrieved } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { blockOptimisticApplied, reportOptimisticApplied } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { selectCommentsForTarget } from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";
import { readModelCacheRehydrated } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

describe("moderation visibility",()=>{
    it("filters globally hidden, personally reported and blocked-author content from cached reads",()=>{
        const store=initReduxStoreWl({dependencies:{}}); const targetId="cafe";
        const item=(id:string,authorId:string,moderation="PUBLISHED")=>({id,targetId,authorId,body:id,createdAt:"2026-09-11T10:00:00Z",likeCount:0,replyCount:0,moderation,version:0});
        store.dispatch(commentsRetrieved({targetId,op:opTypes.RETRIEVE,items:[item("visible","a"),item("hidden","b","HIDDEN"),item("reported","c"),item("blocked","d")] as any}));
        store.dispatch(reportOptimisticApplied({commentId:"reported"}));
        store.dispatch(blockOptimisticApplied({block:{blockId:"block",userId:"d",blockedAt:"2026-09-11T10:00:00Z",version:0}}));
        expect(selectCommentsForTarget(targetId)(store.getState()).comments.map(comment=>comment.id)).toEqual(["visible"]);
    });
    it("migrates legacy cached comment snapshots with safe moderation defaults",()=>{
        const store=initReduxStoreWl({dependencies:{}});
        store.dispatch(readModelCacheRehydrated({comments:{entities:{ids:[],entities:{}},byTarget:{}}} as any));
        const state:any=store.getState().cState;
        expect(state.reportedCommentIds).toEqual({});expect(state.blockedUsers).toEqual({});
    });
});
