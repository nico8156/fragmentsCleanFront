import {AppState} from "@/app/store/appState";
import {createAction, createReducer} from "@reduxjs/toolkit";
import {CommentCommandTypes, CommentCreateCmd, CommentEditCmd, OutboxCommand} from "../comment.type";
import {enqueue} from "@/app/contexts/comment/write/uiCommentClickedRequested";

export const popNext= createAction('comment/outbox/POP_NEXT')
export const dropByPredicate= createAction<(c: OutboxCommand) => boolean>('comment/outbox/DROP_BY_PREDICATE')

export interface OutboxState {
    queue: OutboxCommand[];
    isSuspended: boolean;
}
const initialOutbox: OutboxState = { queue: [], isSuspended: false };

const initialState: AppState["commentOutbox"] = initialOutbox;

export const outboxReducer= createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(enqueue, (state, action) => {
                const cmd = action.payload;
                //interception avant d'ajouter à la queue
                if (cmd.type === CommentCommandTypes.CommentEdit) {
                    const idx = state.queue.findIndex(c => c.type === CommentCommandTypes.CommentEdit && (
                        (c as CommentEditCmd).commentId && (c as CommentEditCmd).commentId === cmd.commentId ||
                        (c as CommentEditCmd).tempId && (c as CommentEditCmd).tempId === cmd.tempId
                    ));
                    if (idx >= 0) state.queue.splice(idx, 1); // found => on le retire pour ensuite ajouter la command la plus recente
                }
                if (cmd.type === "Comment.Delete") {
                    const idxCreate = state.queue.findIndex(c => c.type === CommentCommandTypes.CommentCreate && (
                        (c as CommentCreateCmd).tempId === cmd.tempId
                    ));
                    if (idxCreate >= 0) { state.queue.splice(idxCreate, 1); return; } // on a une deletion sur un create ... on retire le create et return
                }
                state.queue.push(cmd); // si tout est logique, on met à la queue
            })
            .addCase(popNext, (state, action) => {
                state.queue.shift();
            })
            .addCase(dropByPredicate,(state, action)=>{
                state.queue = state.queue.filter(c => !action.payload(c));
            })

    }
)