import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import {Comment} from "@/app/store/appState";


export const commentCreated = createAction<Comment>("COMMENT_CREATED")

export const createComment =
    (userId:string, commentId: string, content:string ):AppThunk<Promise<void>> =>
        async (dispatch, _, {commentGateway}) => {
        //TODO check validation for creating a comment

        //TODO dispatch action commentCreated if validation ok
            await commentGateway.saveComment(userId, commentId, content);
            let newComment:Comment = {id: commentId, text: content};
            dispatch(commentCreated(newComment));
        //TODO if not, dispatch action invalidComment
        };