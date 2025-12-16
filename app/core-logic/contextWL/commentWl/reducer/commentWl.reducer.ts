import {createEntityAdapter, createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {addOptimisticCreated} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {
    CafeId,
    CommentEntity,
    CommentsStateWl,
    loadingStates, opTypes, View
} from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import {createReconciled, createRollback, deleteRollback, updateRollback} from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import {
    commentsRetrievalCancelled,
    commentsRetrievalFailed,
    commentsRetrievalPending,
    commentsRetrieved
} from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import {updateOptimisticApplied} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";
import {deleteReconciled, updateReconciled} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import {deleteOptimisticApplied} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";

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
            .addCase(deleteOptimisticApplied,(state, action)=> {
                const { commentId, clientDeletedAt } = action.payload;
                const c = state.entities.entities[commentId];
                if (!c) return;

                // Soft delete : on garde l'ID pour la cohérence des threads
                // On met un "tombstone" (deletedAt + moderation SOFT_DELETED).
                adapter.updateOne(state.entities, {
                    id: commentId,
                    changes: {
                        deletedAt: clientDeletedAt,
                        moderation: "SOFT_DELETED",
                        optimistic: true,
                        // (option) tu peux masquer le body immédiatement côté UI,
                        // mais garde-le en state pour pouvoir rollback (on n'efface pas ici).
                    }
                });
            })
            .addCase(createReconciled, (state, action) => {
                const { commentId, server } = action.payload;
                const cur = state.entities.entities[commentId];
                if (!cur) return;

                console.log("[REDUCER] createReconciled", { id: commentId, before: cur.optimistic, after: false });

                adapter.updateOne(state.entities, {
                    id: commentId,
                    changes: {
                        optimistic: false,
                        createdAt: server.createdAt,
                        version: server.version,
                    },
                });
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
            .addCase(commentsRetrievalCancelled, (state, action) => {
                const { targetId } = action.payload;
                const v = ensureView(state, targetId);
                // ✅ on sort du PENDING
                v.loading = loadingStates.IDLE;
                // on ne met pas d’erreur, c’est juste un cancel
            })
            .addCase(deleteReconciled, (state, { payload: { commentId, server } }) => {
                const c = state.entities.entities[commentId];
                if (!c) return;

                adapter.updateOne(state.entities, {
                    id: commentId,
                    changes: {
                        deletedAt: server.deletedAt,
                        version: server.version,
                        optimistic: false,
                        // (option) : blank body côté rendu si tu veux un "tombstone" visuel
                        // body: c.body, // on ne touche pas au body ici si tu veux le garder pour modération interne
                    },
                });
            })
            .addCase(deleteRollback, (state, { payload: { commentId, prevBody, prevVersion, prevDeletedAt } }) => {
                const c = state.entities.entities[commentId];
                if (!c) return;

                adapter.updateOne(state.entities, {
                    id: commentId,
                    changes: {
                        body: prevBody,
                        version: prevVersion ?? c.version,
                        deletedAt: prevDeletedAt, // souvent undefined (restaure)
                        optimistic: false,
                        moderation: c.moderation === "SOFT_DELETED" ? "PUBLISHED" : c.moderation,
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
                if(!commentId) return;
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
                const {targetId, error} = action.payload;
                const v = ensureView(state, targetId);
                v.loading = loadingStates.ERROR;
                v.error = error;
            })

    })