import { createReducer } from "@reduxjs/toolkit";
import {
    CommentEditRequest,
    commentEditRequested,
    commentEditValidated, CommentEditValidation
} from "@/app/core-logic/use-cases/comment/comment-update/submitCommentEdit";


export type CommentEditionState = {
    data: CommentEditRequest | null;
    validation: CommentEditValidation | null;
    error: string | null;
};

export const initialEditionState: CommentEditionState = {
    data: null,
    validation: null,
    error: null,
};

export const commentEditionReducer = createReducer(
    initialEditionState,
    (builder) => {
        builder
            .addCase(commentEditRequested, (state, action) => {
                state.data = action.payload;
                state.validation = null;
                state.error = null;
            })
            .addCase(commentEditValidated, (state, action) => {
                state.validation = action.payload;
                state.error = action.payload.status
                    ? null
                    : action.payload.reason ?? "VALIDATION_FAILED";
            });
    },
);
