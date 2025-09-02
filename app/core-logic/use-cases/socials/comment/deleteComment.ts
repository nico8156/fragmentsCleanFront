import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";


export const commentDeleted = createAction<string>("COMMENT_DELETED")

export const deleteComment =
    (commentId : string): AppThunk<Promise<void>> =>
        async (dispatch, _, { commentGateway }) => {
                await commentGateway.deleteComment(commentId);
                dispatch(commentDeleted(commentId));
        };
