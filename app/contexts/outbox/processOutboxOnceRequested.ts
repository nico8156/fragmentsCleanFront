import {Deps} from "@/app/core-logic/gateways/commentWLGateway";
import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {AppDispatch} from "@/app/store/reduxStore";
import {startCommentCreateProcessing} from "@/app/contexts/comment/write/uiCommentClickedRequested";
import {CommentCommandTypes} from "@/app/contexts/comment/comment.type";



export const commentRemoved = createAction<{ commandId: string }>('Comment.Removed');
export const commentReceivedByServer = createAction<{ postId: string; commandId: string }>('Comment.ReceivedByServer');

export const processOutboxFactory=(deps:Deps, callback?:()=>void)=>{
    const processOutbox = createListenerMiddleware();
    const listener = processOutbox.startListening as TypedStartListening<AppState, AppDispatch>;
    let isProcessing = false;
    listener({
        actionCreator: startCommentCreateProcessing,
        effect: async (_, api) => {

            if (isProcessing) return;
            isProcessing = true;

            const items = api.getState().commentOutbox.queue;
            for (const cmd of items) {
                if (cmd.type !== CommentCommandTypes.CommentCreate) continue;
                try{
                    await deps.api.createComment({ postId: cmd.postId, body: cmd.body, commandId: cmd.commandId, draftId: cmd.draftId });
                    api.dispatch(commentRemoved({ commandId: cmd.commandId }));
                    api.dispatch(commentReceivedByServer({ postId: cmd.postId, commandId: cmd.commandId }))

                } catch (e) {
                    console.log(e);

                    const msg = String(e);
                    const retryable = /ECONN|ETIMEDOUT|timeout|5\d\d/.test(msg);
                    if(retryable){
                        api.dispatch(commentBumped({ commandId: cmd.commandId, error: msg }));
                        await api.delay(backoff(cmd.attempts));
                    } else {

                    }

                }

            }
            callback?.();
        }
    })
    return processOutbox;
}