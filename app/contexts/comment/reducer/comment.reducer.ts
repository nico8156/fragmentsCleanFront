import {AppState} from "@/app/store/appState";
import {createAction, createReducer} from "@reduxjs/toolkit";
import {TempId, Comment} from "@/app/contexts/comment/comment.type";
import {commentCreateOptimisticApplied} from "@/app/contexts/comment/write/uiCommentClickedRequested";


export const replaceTempWithServer = createAction<void>('comment/replaceTempWithServer')
export const applyServerItems = createAction<{ postId: string; items: Omit<Comment, "_local" | "tempId">[]; nextCursor?: string; serverTime?: string }>('comment/applyServerItems')
export const markFailed =createAction<{ idOrTemp: string; error: string }>('comment/markFailed')
export const editLocal = createAction<{ idOrTemp: string; body: string; now: string }>('comment/editLocal')
export const removeLocal = createAction<{ idOrTemp: string }>('comment/removeLocal')
export const markDeletedLocal = createAction<{ idOrTemp: string }>('comment/markDeletedLocal')

const initialCommentsState: AppState["comments"] = {
    byId: {},
    idMap: { tempToServer: {} },
};

const initialState: AppState["comments"] = initialCommentsState;

export const commentReducer= createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(commentCreateOptimisticApplied, (state, action) => {
                const c = action.payload;
                const key = c.id ?? c.tempId!;
                state.byId[key] = c;
                //const list = (state.byPostId[c.postId] ??= { ids: [] });
                //if (!list.ids.includes(key)) list.ids.unshift(key);
            })
            .addCase(replaceTempWithServer,(state, action) => {
                // créer la version finale en conservant quelques métadonnées locales utiles
            })
            .addCase(applyServerItems, (state, action) => {
                const { postId, items, nextCursor, serverTime } = action.payload;

                for (const dto of items) {
                    const existingKey = dto.id && state.byId[dto.id] ? dto.id : undefined;
                    if (!existingKey) {
                        // nouvel item serveur
                        state.byId[dto.id!] = {...dto, _local: {sync: "sent", version: 1}} as Comment;

                    } else {
                        const local = state.byId[existingKey] as Comment;
                        // si local a une version plus récente (édition en cours), ne pas écraser le body
                        if (new Date(dto.updatedAt).getTime() > new Date(local.updatedAt).getTime() && local._local.sync !== "pending") {
                            state.byId[existingKey] = {...dto, _local: {...local._local, sync: "sent"}} as Comment;
                        } else {
                            // garder local (plus récent ou en pending)
                        }
                    }
                }
            })
            .addCase(editLocal,((state, action) => {
                const c = state.byId[action.payload.idOrTemp]; if (c) { c.body = action.payload.body; c.updatedAt = action.payload.now; c._local.version++; c._local.sync = "pending"; }
            }))
            .addCase(markFailed, (state, action) => {
                const c = state.byId[action.payload.idOrTemp]; if (c) { c._local.sync = "failed"; c._local.lastError = action.payload.error; }
            })
            .addCase(removeLocal, (state, action) => {
                const id = action.payload.idOrTemp; const c = state.byId[id]; if (!c) return;

                delete state.byId[id];
            })
            .addCase(markDeletedLocal, (state, action) => {
                const c = state.byId[action.payload.idOrTemp]; if (c) { c.status = "deleted"; c._local.sync = "pending"; }
            })
    }
)