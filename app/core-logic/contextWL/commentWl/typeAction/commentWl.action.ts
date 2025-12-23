import { createAction } from "@reduxjs/toolkit";
import {CommentEntity} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";


export const addOptimisticCreated = createAction<{ entity: CommentEntity }>("COMMENT/OPTIMISTIC_CREATED");

export const updateOptimisticApplied = createAction<{
    commentId: string;
    newBody: string;
    clientEditedAt: string;
}>("COMMENT/OPTIMISTIC_UPDATED");

export const deleteOptimisticApplied = createAction<{
    commentId: string;
    clientDeletedAt: string;
}>("COMMENT/OPTIMISTIC_DELETED");
