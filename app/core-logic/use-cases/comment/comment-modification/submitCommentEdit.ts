import { createAction } from "@reduxjs/toolkit";

export type CommentEditRequest = {
    editorId: string;
    commentId: string;
    newContent: string;
};

export type CommentEditValidation = {
    status: boolean;
    reason?: "NOT_AUTHOR" | "EMPTY_CONTENT";
    request: CommentEditRequest;
};

export const commentEditRequested =
    createAction<CommentEditRequest>("COMMENT_EDIT_REQUESTED");

export const commentEditValidated =
    createAction<CommentEditValidation>("COMMENT_EDIT_VALIDATED");
