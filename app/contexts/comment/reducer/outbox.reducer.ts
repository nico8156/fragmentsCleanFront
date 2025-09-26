import {AppState} from "@/app/store/appState";
import {createAction, createReducer} from "@reduxjs/toolkit";
import {CommentCreateCmd, CommentEditCmd, OutboxCommand} from "../comment.type";
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
                // Squash basique: Edit sur même cible -> garder la dernière
                const cmd = action.payload;
                if (cmd.type === "Comment.Edit") {
                    const idx = state.queue.findIndex(c => c.type === "Comment.Edit" && (
                        (c as CommentEditCmd).commentId && (c as CommentEditCmd).commentId === cmd.commentId ||
                        (c as CommentEditCmd).tempId && (c as CommentEditCmd).tempId === cmd.tempId
                    ));
                    if (idx >= 0) state.queue.splice(idx, 1);
                }
                if (cmd.type === "Comment.Delete") {
                    // si un Create existe pour le même tempId -> drop le Create et n'empile pas Delete
                    const idxCreate = state.queue.findIndex(c => c.type === "Comment.Create" && (
                        (c as CommentCreateCmd).tempId === cmd.tempId
                    ));
                    if (idxCreate >= 0) { state.queue.splice(idxCreate, 1); return; }
                }
                state.queue.push(cmd);

            })
            .addCase(popNext, (state, action) => {
                state.queue.shift();
            })
            .addCase(dropByPredicate,(state, action)=>{
                state.queue = state.queue.filter(c => !action.payload(c));
            })

    }
)