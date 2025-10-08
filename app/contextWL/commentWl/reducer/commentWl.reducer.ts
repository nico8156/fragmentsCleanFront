import {createEntityAdapter, createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {addOptimisticCreated} from "@/app/contextWL/commentWl/cc";
import {CommentEntity} from "@/app/contextWL/commentWl/commentWl.type";
import {createReconciled, createRollback} from "@/app/contextWL/outboxWl/processOutbox";


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
            .addCase(createReconciled,(state, action) => {
                const { tempId, server } = action.payload;
                const temp = state.entities.entities[tempId];
                if (!temp) return;
                const newEntity = {
                    ...temp,
                    id: server.id,
                    createdAt: server.createdAt ?? temp.createdAt,
                    version: server.version ?? temp.version,
                    optimistic: false,
                };
                // remplace dans les vues
                const targetView = state.byTarget[temp.targetId];
                if (targetView) {
                    targetView.ids = targetView.ids.map((id) => (id === tempId ? server.id : id));
                }
                // remplace dans le catalogue
                adapter.addOne(state.entities, newEntity);
                adapter.removeOne(state.entities, tempId);
            })
            .addCase(createRollback,(state,action)=> {
                const { tempId, targetId, parentId } = action.payload;
                adapter.removeOne(state.entities, tempId);
                const v = state.byTarget[targetId];
                if (v) v.ids = v.ids.filter((id) => id !== tempId);
                if (parentId) {
                    const parent = state.entities.entities[parentId];
                    if (parent && parent.replyCount > 0) parent.replyCount -= 1;
                }
            })
    })