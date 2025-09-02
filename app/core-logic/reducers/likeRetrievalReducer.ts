import {createReducer} from "@reduxjs/toolkit";
import {AppState, Like} from "@/app/store/appState";
import {likeRetrieved} from "@/app/core-logic/use-cases/socials/like/retrieveLike";
import {coffeeLiked} from "@/app/core-logic/use-cases/socials/like/likeCoffee";
import {coffeeUnliked} from "@/app/core-logic/use-cases/socials/like/unlikeCoffee";

const initialState: AppState["likeRetrieval"] = {
    data: [] as Like[]
}

export const likeRetrievalReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(likeRetrieved, (_, action) => {
                return {data: action.payload}
            })
            .addCase(coffeeLiked, (state, action) => {
                return {data: [...state.data, action.payload]}
            })
            .addCase(coffeeUnliked, (state, action) => {
                return {data: state.data.filter(l => l.id !== action.payload )}
            })
    }
)