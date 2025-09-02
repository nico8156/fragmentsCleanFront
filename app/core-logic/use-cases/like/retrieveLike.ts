import { Like } from "@/app/store/appState";
import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";

export const likeRetrieved = createAction<Like[]>("LIKE_RETRIEVED")

export const retrieveLike =
    ():AppThunk<Promise<void>> =>
    async (dispatch, getState, {likeGateway}) => {
        const like = await likeGateway.retrieveLike();
        dispatch(likeRetrieved(like));
    }