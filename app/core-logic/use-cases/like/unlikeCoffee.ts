import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import {Like} from "@/app/store/appState";

export const coffeeUnliked = createAction<string>("COFFEE_UNLIKED")

export const unlikeCoffee =
    (like:Like) : AppThunk<Promise<void>> =>
async (dispatch, _, { likeGateway }) => {
    await likeGateway.unlike(like.coffeeId, like.userId);
    dispatch(coffeeUnliked(like.coffeeId));
};