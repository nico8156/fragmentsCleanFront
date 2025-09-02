import {AppThunk} from "@/app/store/reduxStore";
import {Comment} from "@/app/store/appState";
import {createAction} from "@reduxjs/toolkit";

export const commentUpdated = createAction<Comment>("COMMENT_UPDATED")

export const updateComment =
    (commentId: string,userId:string,  newContent:string):AppThunk<Promise<void>> =>
    async (dispatch, _, { commentGateway }) =>{
      //TODO validation

        // TODO update the new comment
        await commentGateway.updateComment(commentId,userId , newContent);
        let updatedComment : Comment = {id: commentId, text: newContent};
        dispatch(commentUpdated(updatedComment));
    };
