import {createEntityAdapter, createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {addOptimisticCreated} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {
    CafeId,
    CommentEntity, CommentId,
    CommentsStateWl,
    loadingStates
} from "@/app/contextWL/commentWl/type/commentWl.type";
import {createReconciled, createRollback} from "@/app/contextWL/outboxWl/processOutbox";
import {commentRetrievedWl} from "@/app/contextWL/commentWl/usecases/read/commentRetrieval";

const initialState:AppStateWl["comments"] = {
    byTarget: {}, entities: { ids: [], entities: {} }, ui: {composing: {draftBody: "", sending: false}}
}

const adapter = createEntityAdapter<CommentEntity>({
    sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});


const ensureView = (state: CommentsStateWl, targetId: CafeId) => {
    return (state.byTarget[targetId] ??= { ids: [], loading: loadingStates.IDLE });
};

const mergeUnique = (dst: CommentId[], ids: CommentId[]) => {

    const seen = new Set(dst)

    for (const id of ids) if (!seen.has(id)) {
        dst.push(id)
        seen.add(id)
    }
};

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
            .addCase(commentRetrievedWl,(state, action)=> {
                const {targetId, items, nextCursor, serverTime } = action.payload
                // update catalogue
                adapter.upsertMany(state.entities, items as CommentEntity[])
                //prepare the view
                const v = ensureView(state, targetId);
                mergeUnique(v.ids, items.map(i => i.id));
                v.nextCursor = nextCursor ?? undefined;
                v.loading = loadingStates.SUCCESS;
                if (serverTime && !v.anchor) v.anchor = serverTime; // ancre du premier hit
            })
    })