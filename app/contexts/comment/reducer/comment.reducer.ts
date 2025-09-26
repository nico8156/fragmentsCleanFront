import {AppState, CommentsState} from "@/app/store/appState";
import {createAction, createReducer} from "@reduxjs/toolkit";
import {TempId, Comment} from "@/app/contexts/comment/comment.type";


export const replaceTempWithServer = createAction<{ tempId: TempId; server: Omit<Comment, "_local" | "tempId"> }>('comment/replaceTempWithServer')
export const upsertOne=createAction<Comment>('comment/upsertOne')
export const applyServerItems = createAction<{ postId: string; items: Omit<Comment, "_local" | "tempId">[]; nextCursor?: string; serverTime?: string }>('comment/applyServerItems')
export const markFailed =createAction<{ idOrTemp: string; error: string }>('comment/markFailed')
export const editLocal = createAction<{ idOrTemp: string; body: string; now: string }>('comment/editLocal')
export const removeLocal = createAction<{ idOrTemp: string }>('comment/removeLocal')
export const markDeletedLocal = createAction<{ idOrTemp: string }>('comment/markDeletedLocal')

const initialCommentsState: CommentsState = {
    byId: {},
    byPostId: {},
    idMap: { tempToServer: {} },
};

const initialState: AppState["comments"]["comments"] = initialCommentsState;

export const commentReducer= createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(upsertOne, (state, action) => {
                const c = action.payload; const key = c.id ?? c.tempId!;
                state.byId[key] = c;
                const list = (state.byPostId[c.postId] ??= { ids: [] });
                if (!list.ids.includes(key)) list.ids.unshift(key);
            })
            .addCase(replaceTempWithServer,(state, action) => {
                const server = action.payload.server;
                const tempId = action.payload.tempId;
                const key = tempId;
                const local = state.byId[key];
                if (!local) return;
                // créer la version finale en conservant quelques métadonnées locales utiles
                const final: Comment = {
                    ...server,
                    _local: { sync: "sent", version: Math.max(local._local.version, 1) },
                } as Comment;
                delete state.byId[key];
                state.byId[server.id!] = final;
                state.idMap.tempToServer[tempId] = server.id!;
                const list = state.byPostId[server.postId] ?? { ids: [] };
                state.byPostId[server.postId] = list;
                // remplace l'id dans la liste
                list.ids = list.ids.map(x => (x === tempId ? server.id! : x));
            })
            .addCase(applyServerItems, (state, action) => {
                const { postId, items, nextCursor, serverTime } = action.payload;
                const list = (state.byPostId[postId] ??= { ids: [] });
                if (nextCursor) list.serverCursor = nextCursor;
                if (serverTime) list.lastServerTime = serverTime;
                for (const dto of items) {
                    const existingKey = dto.id && state.byId[dto.id] ? dto.id : undefined;
                    if (!existingKey) {
                        // nouvel item serveur
                        state.byId[dto.id!] = {...dto, _local: {sync: "sent", version: 1}} as Comment;
                        if (!list.ids.includes(dto.id!)) list.ids.push(dto.id!);
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
                const list = state.byPostId[c.postId]; if (list) list.ids = list.ids.filter(x => x !== id);
                delete state.byId[id];
            })
            .addCase(markDeletedLocal, (state, action) => {
                const c = state.byId[action.payload.idOrTemp]; if (c) { c.status = "deleted"; c._local.sync = "pending"; }
            })
    }
)