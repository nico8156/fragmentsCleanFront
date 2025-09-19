import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import {Like} from "@/app/store/appState";

export const coffeeLiked = createAction<Like>("COFFEE_LIKED")
export const coffeeLikeRequested = createAction<{ id:string; userId:string; coffeeId:string }>("exchanges/coffeeLikeRequested");
export const coffeeLikeConfirmed = createAction<{ id:string; userId:string; coffeeId:string }>("exchanges/coffeeLikeConfirmed");
export const coffeeLikeFailed    = createAction<{ id:string; userId:string; coffeeId:string; reason:string }>("exchanges/coffeeLikeFailed");

export const likeCoffee =
    (id: string, userId: string, coffeeId: string) :AppThunk<Promise<void>> =>
        async (dispatch, getState, {likeGateway}) => {
            dispatch(coffeeLikeRequested({ id, userId, coffeeId }));
            return Promise.resolve();
            // await likeGateway.like(coffeeId, userId);
            // dispatch(coffeeLiked({id, userId, coffeeId}));
}