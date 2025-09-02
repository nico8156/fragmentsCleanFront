import {createAction} from "@reduxjs/toolkit";
import {Comment} from "@/app/store/appState";
import {AppThunk} from "@/app/store/reduxStore";

export const commentRetrieved = createAction<Comment[]>("COMMENT_RETRIEVED")

export const retrieveComment =
    (): AppThunk<Promise<void>> =>
        async (dispatch, _, { commentGateway }) => {
            const comment = await commentGateway.retrieveComment();
            dispatch(commentRetrieved(comment));
        };