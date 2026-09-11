import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";
import { commentModerationUseCaseFactory, uiCommentReportRequested, uiUserBlockRequested, uiUserUnblockRequested } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentModerationWlUseCase";
import { commandKinds, type CommandId, type ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { FakeCommentsWlGateway } from "@/tests/core-logic/fakes/FakeCommentsWlGateway";
import { sendOutboxCommand } from "@/app/core-logic/contextWL/outboxWl/commandHandlers/outboxCommandHandlers";

const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
describe("comment moderation offline-first commands",()=>{
    let index=0; const ids=["11111111-1111-1111-1111-111111111111","22222222-2222-2222-2222-222222222222","33333333-3333-3333-3333-333333333333","44444444-4444-4444-4444-444444444444"];
    const setup=()=>{
        index=0; const gateway=new FakeCommentsWlGateway();
        const deps:DependenciesWl={gateways:{comments:gateway} as any,helpers:{
            nowIso:()=>"2026-09-11T10:00:00Z" as ISODate,currentUserId:()=>"me",currentUserProfile:()=>null,
            newCommandId:()=>ids[index++] as CommandId,
        }};
        return initReduxStoreWl({dependencies:deps,listeners:[commentModerationUseCaseFactory(deps).middleware]});
    };
    it("immediately hides a reported comment and queues durable intent",async()=>{
        const store=setup(); store.dispatch(uiCommentReportRequested({commentId:"comment-1",reason:"SPAM"})); await flush();
        const state:any=store.getState(); expect(state.cState.reportedCommentIds["comment-1"]).toBe(true);
        const record=Object.values(state.oState.byId)[0] as any;
        expect(record.item.command).toMatchObject({kind:commandKinds.CommentReport,commentId:"comment-1",reason:"SPAM"});
    });
    it("blocks then queues unblock with the same stable block id",async()=>{
        const store=setup(); store.dispatch(uiUserBlockRequested({userId:"author-1",displayName:"Author"})); await flush();
        const block=(store.getState() as any).cState.blockedUsers["author-1"]; expect(block).toBeDefined();
        store.dispatch(uiUserUnblockRequested({userId:"author-1"})); await flush();
        const state:any=store.getState(); expect(state.cState.blockedUsers["author-1"]).toBeUndefined();
        const commands=Object.values(state.oState.byId).map((r:any)=>r.item.command);
        expect(commands[1]).toMatchObject({kind:commandKinds.UserBlockSet,active:false,blockId:block.blockId});
    });
    it("maps moderation outbox commands to the comments gateway",async()=>{
        const gateway=new FakeCommentsWlGateway();
        await sendOutboxCommand({gateway,command:{kind:commandKinds.CommentReport,commandId:"c" as CommandId,reportId:"r",commentId:"comment",reason:"OTHER",at:"2026-09-11T10:00:00Z" as ISODate}} as any);
        await sendOutboxCommand({gateway,command:{kind:commandKinds.UserBlockSet,commandId:"b" as CommandId,blockId:"block",blockedUserId:"user",active:true,at:"2026-09-11T10:00:00Z" as ISODate}} as any);
        expect(gateway.reportCalls).toHaveLength(1);expect(gateway.blockCalls).toHaveLength(1);
    });
});
