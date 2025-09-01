import {AppState} from "@/app/store/appState";
import {createReducer} from "@reduxjs/toolkit";
import {commentRetrieved} from "@/app/core-logic/use-cases/comment/comment-retrieval/retrieveComment";
import {commentCreated} from "@/app/core-logic/use-cases/comment/comment-creation/createComment";

const initialState: AppState["commentRetrieval"] = {
    data: []
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
    }
)