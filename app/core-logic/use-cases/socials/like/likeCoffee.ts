import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import {Like} from "@/app/store/appState";

export const coffeeLiked = createAction<Like>("COFFEE_LIKED")

export const likeCoffee =
    (id: string, userId: string, coffeeId: string) :AppThunk<Promise<void>> =>
        async (dispatch, getState, {likeGateway}) => {
            //TODO check valid like ?
            //TODO do the job
            await likeGateway.like(coffeeId, userId);
            dispatch(coffeeLiked({id, userId, coffeeId}));
}