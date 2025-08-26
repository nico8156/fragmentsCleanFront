import {AppState} from "@/app/store/appState";
import {createReducer} from "@reduxjs/toolkit";
import {commentRetrieved} from "@/app/core-logic/use-cases/comment/comment-retrieval/retrieveComment";

const initialState: AppState["commentRetrieval"] = {
    data: null
}

export const commentRetrievalReducer= createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(commentRetrieved, (_, action) => {
                return {data: action.payload}
            })
    }
)