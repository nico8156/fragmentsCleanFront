import {AppState, Comment} from "@/app/store/appState";
import {createReducer} from "@reduxjs/toolkit";
import {commentRetrieved} from "@/app/core-logic/use-cases/comment/comment-retrieval/retrieveComment";
import {commentCreated} from "@/app/core-logic/use-cases/comment/comment-creation/createComment";
import {commentUpdated} from "@/app/core-logic/use-cases/comment/comment-update/updateComment";
import {commentDeleted} from "@/app/core-logic/use-cases/comment/comment-deletion/deleteComment";

const initialState: AppState["commentRetrieval"] = {
    data: [] as Comment[]
}

export const commentRetrievalReducer= createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(commentRetrieved, (_, action) => {
                return {data: action.payload}
            })
            .addCase(commentCreated, (state, action) => {
                state.data = [...state.data, action.payload]
            })
            .addCase(commentUpdated, (state, action) => {
                state.data = state.data.map(comment => comment.id === action.payload.id ? action.payload : comment)
            })
            .addCase(commentDeleted, (state, action) => {
                state.data = state.data.filter(comment=> comment.id !== action.payload);
            })
    }
)