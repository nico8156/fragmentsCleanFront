import {createEntityAdapter, createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {addOptimisticCreated} from "@/app/contextWL/commentWl/cc";
import {CommentEntity} from "@/app/contextWL/commentWl/commentWl.type";


const initialState:AppStateWl["comments"] = {
    byTarget: {}, entities: { ids: [], entities: {} }, ui: {composing: {draftBody: "", sending: false}}

}


const adapter = createEntityAdapter<CommentEntity>({
    sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

export const commentWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(addOptimisticCreated,(state, action) => {
                const c = action.payload.entity
                adapter.addOne(state.entities, c);
                state.byTarget[c.targetId] = state.byTarget[c.targetId] ?? { ids: [] };
                state.byTarget[c.targetId].ids.unshift(c.id);
                if (c.parentId) {
                    const parent = state.entities.entities[c.parentId];
                    if (parent) parent.replyCount += 1;
                }
            })
    })