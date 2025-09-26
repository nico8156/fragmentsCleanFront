import {AppState} from "@/app/store/appState";
import {createAction, createReducer} from "@reduxjs/toolkit";
import {likeConfirmed, likeOptimisticApplied} from "@/app/contexts/like/write/like.listener";
import {TargetId} from "@/app/contexts/like/like.type";


export const likeFailedReverted = createAction<{ targetId: TargetId; previousLiked: boolean }>('like/FAILED_REVERTED')
export const likesHydrated = createAction<Array<{ targetId: TargetId; liked: boolean; count?: number }>>('like/HYDRATED')

const initialState: AppState["likes"] = {
    byId:{},
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
                    //count: action.payload.serverCount ?? cur.count,
                }
            })
            .addCase(likeFailedReverted, (state, action) => {
                const cur = state.byId[action.payload.targetId];
                if (!cur) return;
                const delta = cur.liked === action.payload.previousLiked ? 0 : (action.payload.previousLiked ? +1 : -1);
                state.byId[action.payload.targetId] = {
                    ...cur,
                    liked: action.payload.previousLiked,
                    count: (cur.count ?? 0) + delta,
                    pending: false,
                }
            })
            .addCase(likesHydrated, (state, action) => {
                    for (const it of action.payload) {
                        state.byId[it.targetId] = { liked: it.liked, count: it.count, pending: false };
                    }
            })
    }
)