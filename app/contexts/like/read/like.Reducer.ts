import {AppState} from "@/app/store/appState";
import {createReducer} from "@reduxjs/toolkit";
import {likeConfirmed, likeOptimisticApplied} from "@/app/contexts/like/write/like.listener";


const initialState: AppState["likes"] = {
    byId:{}
}

export const likeReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(likeOptimisticApplied, (state, action) => {
                const cur = state.byId[action.payload.targetId] ?? { liked: false, count: 0 };
                const delta = cur.liked === action.payload.liked ? 0 : (action.payload.liked ? +1 : -1);
                state.byId[action.payload.targetId] = {
                    liked: action.payload.liked,
                    count: (cur.count ?? 0) + delta,
                    pending: true,
                    lastUpdateAt: action.payload.now,
                }
            })
            .addCase(likeConfirmed, (state, action) => {
                const cur = state.byId[action.payload.targetId];
                if (!cur) return;
                state.byId[action.payload.targetId] = {
                    ...cur,
                    pending: false,
                    // si le serveur renvoie un compteur autoritatif
                    count: action.payload.serverCount ?? cur.count,
                };
            })
            .addCase(likeFailedReverted, (state, action) => {
                return {data: state.data.filter(l => l.id !== action.payload )}
            })
            .addCase(likesHydrated, (state, action) => {
                return {data: state.data.filter(l => l.id !== action.payload )}
            })
    }
)