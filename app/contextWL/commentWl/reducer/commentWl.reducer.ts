import {createEntityAdapter, createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {addOptimisticCreated} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {
    CafeId,
    CommentEntity,
    CommentsStateWl,
    loadingStates, opTypes, View
} from "@/app/contextWL/commentWl/type/commentWl.type";
import {createReconciled, createRollback, updateRollback} from "@/app/contextWL/outboxWl/processOutbox";
import {
    commentsRetrievalFailed,
    commentsRetrievalPending,
    commentsRetrieved
} from "@/app/contextWL/commentWl/usecases/read/commentRetrieval";
import {updateOptimisticApplied} from "@/app/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";
import {updateReconciled} from "@/app/contextWL/commentWl/usecases/read/ackReceivedBySocket";

const adapter = createEntityAdapter<CommentEntity>({
    sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

const initialState:AppStateWl["comments"] = {
    entities: adapter.getInitialState(),
    byTarget: {},
}

const ensureView = (state: CommentsStateWl, targetId: CafeId): View => {
    return (state.byTarget[targetId] ??= {
        ids: [],
        loading: loadingStates.IDLE,
        filters: { sort: "new" },
        staleAfterMs: 30_000,
    });
};

const mergeUniqueAppend = (dst: string[], src: string[]) => {
    const seen = new Set(dst);
    for (const id of src) if (!seen.has(id)) { dst.push(id); seen.add(id); }
};

const mergeUniquePrepend = (dst: string[], src: string[]) => {
    const seen = new Set(dst);
    for (let i = src.length - 1; i >= 0; i--) {
        const id = src[i];
        if (!seen.has(id)) { dst.unshift(id); seen.add(id); }
    }
};

export const commentWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(addOptimisticCreated,(state, action) => {
                const c = action.payload.entity
                // 1) catalogue
                adapter.addOne(state.entities, c);
                // 2) vue complète (créée si absente)
                const v = ensureView(state, c.targetId);
                // 3) insérer en tête sans doublon (tri "new")
                mergeUniquePrepend(v.ids, [c.id]);

                if (c.parentId) {
                    const parent = state.entities.entities[c.parentId];
                    if (parent) parent.replyCount += 1;
                }
                return
            })
            .addCase(createReconciled,(state, action) => {
                const { tempId, server } = action.payload;
                const temp = state.entities.entities[tempId];
                if (!temp) return;

                const { targetId, parentId } = temp;
                // remplace l’entité
                adapter.removeOne(state.entities, tempId);
                adapter.addOne(state.entities, {
                    ...temp,
                    id: server.id,
                    optimistic: false,
                    createdAt: server.createdAt,
                    version: server.version,
                });
                // remplace dans les vues
                const v = state.byTarget[targetId];
                if (v?.ids) {
                    for (let i = 0; i < v.ids.length; i++) if (v.ids[i] === tempId) v.ids[i] = server.id;
                }
            })
            .addCase(updateReconciled, (state, action)=> {
                const { commentId, server } = action.payload;
                const cur = state.entities.entities[commentId];
                if (!cur) return;
                adapter.updateOne(state.entities, {
                    id: commentId,
                    changes: {
                        body: server.body ?? cur.body, // si le serveur renvoie un body modéré
                        editedAt: server.editedAt,
                        version: server.version,
                        optimistic: false,
                    },
                });
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
            .addCase(updateRollback,(state,action)=> {
                const { commentId, prevBody, prevVersion } = action.payload;
                const cur = state.entities.entities[commentId];
                if (!cur) return;
                adapter.updateOne(state.entities, {
                    id: commentId,
                    changes: {
                        body: prevBody,
                        version: prevVersion ?? cur.version,
                        optimistic: false,
                    },
                });
            })
            .addCase(commentsRetrievalPending,(state, action) => {
                const {targetId} = action.payload;
                const v = ensureView(state, targetId);
                v.loading = loadingStates.PENDING;
                v.error = undefined;
            })
            .addCase(commentsRetrieved,(state, action)=> {
                const { targetId, op, items, nextCursor, prevCursor, serverTime } = action.payload;
                // 1) catalogue
                adapter.upsertMany(state.entities, items);
                // 2) vue
                const v = ensureView(state, targetId);
                // politique d’insertion selon l’opération
                const newIds = items.map((i) => i.id);
                const incomingIdsForTarget = items
                    .filter(i => i.targetId === targetId)  // <- filtre indispensable
                    .map(i => i.id);

                if (op === opTypes.RETRIEVE) {
                    // replace (snapshot initiale)
                    v.ids = [];
                    mergeUniqueAppend(v.ids, incomingIdsForTarget); // ordre de la page reçue
                    v.anchor ??= serverTime;          // set si jamais défini
                } else if (op === opTypes.OLDER) {
                    // pagination vers le bas
                    mergeUniqueAppend(v.ids, incomingIdsForTarget); // append en bas
                } else if (op === opTypes.REFRESH) {
                    // nouveaux items (plus récents que l’anchor)
                    mergeUniquePrepend(v.ids, incomingIdsForTarget); // prepend en haut
                    if (serverTime) v.anchor = serverTime; // avance la watermark
                }
                // cursors & flags
                v.nextCursor = nextCursor ?? v.nextCursor;
                v.prevCursor = prevCursor ?? v.prevCursor;
                v.loading = loadingStates.SUCCESS;
                v.error = undefined;
                v.lastFetchedAt = new Date().toISOString();
            })
            .addCase(commentsRetrievalFailed,(state, action) => {
                const {targetId, op, error} = action.payload;
                const v = ensureView(state, targetId);
                v.loading = loadingStates.ERROR;
                v.error = error;
            })
            .addCase(updateOptimisticApplied,(state, action)=> {
                const { commentId, newBody, clientEditedAt } = action.payload;
                const cur = state.entities.entities[commentId];
                if (!cur) return;
                adapter.updateOne(state.entities, {
                    id: commentId,
                    changes: {
                        body: newBody,
                        editedAt: clientEditedAt,
                        optimistic: true, // on marque qu’un patch local est en vol
                    },
                });
            })
    })