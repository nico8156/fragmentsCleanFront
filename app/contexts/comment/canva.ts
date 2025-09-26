// Comments + Outbox (Listeners-first) — robust, dans le prolongement de ton approche
// ---------------------------------------------------------------------------------
// Design:
// - Orchestration via createListenerMiddleware (use cases)
// - UI -> actions "ui/*" ; use cases listeners orchestrent état (comments) + outbox
// - Idempotence: commandId (nanoid/uuid) et optionnel draftId
// - Backoff exponentiel cap 60s + jitter
// - Squash: Edit sur Create pending fusionné ; Delete sur Create pending annule tout
// - Mapping tempId -> serverId à l'ACK, reconcile sans casser versions locales
// - Retrieve (poll) branché sur ouverture d'écran + lifecycle

import { createSlice, createAction, nanoid, PayloadAction } from "@reduxjs/toolkit";
import type { AnyAction } from "@reduxjs/toolkit";
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";

// ------------------------------------
// Types domaine
// ------------------------------------
export type CommentId = string;
export type TempId = string;
export type LocalSyncState = "idle" | "pending" | "sent" | "failed";
export type CommentStatus = "visible" | "deleted";

export interface Comment {
    id?: CommentId;        // défini après ACK
    tempId?: TempId;       // présent avant ACK
    postId: string;        // ou ticketId
    authorId: string;
    body: string;
    createdAt: string;     // ISO
    updatedAt: string;     // ISO
    status: CommentStatus; // visible | deleted
    _local: {
        sync: LocalSyncState;
        lastError?: string;
        version: number;     // incrément local à chaque modif
    };
}

// ------------------------------------
// Outbox — Port (dépendances) & Commandes
// ------------------------------------
export type CommandBase = {
    commandId: string;
    createdAt: string; // ISO
    attempt: number;
};

export type CommentCreateCmd = CommandBase & {
    type: "Comment.Create";
    tempId: TempId;
    postId: string;
    body: string;
    draftId?: string;
};

export type CommentEditCmd = CommandBase & {
    type: "Comment.Edit";
    commentId?: CommentId;
    tempId?: TempId;
    body: string;
};

export type CommentDeleteCmd = CommandBase & {
    type: "Comment.Delete";
    commentId?: CommentId;
    tempId?: TempId;
    reason?: "user" | "moderation";
};

export type CommentRetrieveJob = CommandBase & {
    type: "Comment.Retrieve";
    postId: string;
    cursor?: string;
    direction?: "initial" | "since" | "older" | "newer";
};

export type OutboxCommand =
    | CommentCreateCmd
    | CommentEditCmd
    | CommentDeleteCmd
    | CommentRetrieveJob;

// Gateway API abstraite (HTTP/SDK), injectée dans les listeners
export interface CommentsApi {
    createComment(params: {
        postId: string;
        body: string;
        commandId: string;
        draftId?: string;
    }): Promise<{ comment: Omit<Comment, "_local" | "tempId"> }>; // renvoie DTO serveur

    editComment(params: {
        id: CommentId;
        body: string;
        commandId: string;
    }): Promise<{ comment: Omit<Comment, "_local" | "tempId"> }>;

    deleteComment(params: {
        id: CommentId;
        commandId: string;
    }): Promise<{ id: CommentId; status: CommentStatus; updatedAt: string }>;

    retrieveForPost(params: {
        postId: string;
        cursor?: string;
        since?: string;
        limit?: number;
    }): Promise<{ items: Omit<Comment, "_local" | "tempId">[]; nextCursor?: string; serverTime: string }>;
}

export interface Clock { nowISO(): string }
export interface IdGen { newId(): string }

export interface Deps {
    api: CommentsApi;
    clock: Clock;
    ids: IdGen;
    selectCurrentUserId: (state: CommentRoot) => string;
}

// ------------------------------------
// Slices — Comments & Outbox (queue minimale)
// ------------------------------------
export interface CommentsState {
    byId: Record<string, Comment>; // key: commentId ou tempId
    byPostId: Record<string, { ids: string[]; serverCursor?: string; lastServerTime?: string }>;
    idMap: { tempToServer: Record<TempId, CommentId> };
}

const initialCommentsState: CommentsState = {
    byId: {},
    byPostId: {},
    idMap: { tempToServer: {} },
};

export const commentsSlice = createSlice({
    name: "comments",
    initialState: initialCommentsState,
    reducers: {
        upsertMany(state, action: PayloadAction<Comment[]>) {
            for (const c of action.payload) {
                const key = c.id ?? c.tempId!;
                state.byId[key] = c;
                const list = (state.byPostId[c.postId] ??= { ids: [] });
                if (!list.ids.includes(key)) list.ids.unshift(key); // tri: nouveaux en haut
            }
        },
        upsertOne(state, action: PayloadAction<Comment>) {
            const c = action.payload; const key = c.id ?? c.tempId!;
            state.byId[key] = c;
            const list = (state.byPostId[c.postId] ??= { ids: [] });
            if (!list.ids.includes(key)) list.ids.unshift(key);
        },
        markPending(state, action: PayloadAction<{ idOrTemp: string }>) {
            const c = state.byId[action.payload.idOrTemp]; if (c) c._local.sync = "pending";
        },
        markSent(state, action: PayloadAction<{ idOrTemp: string }>) {
            const c = state.byId[action.payload.idOrTemp]; if (c) c._local.sync = "sent";
        },
        markFailed(state, action: PayloadAction<{ idOrTemp: string; error: string }>) {
            const c = state.byId[action.payload.idOrTemp]; if (c) { c._local.sync = "failed"; c._local.lastError = action.payload.error; }
        },
        editLocal(state, action: PayloadAction<{ idOrTemp: string; body: string; now: string }>) {
            const c = state.byId[action.payload.idOrTemp]; if (c) { c.body = action.payload.body; c.updatedAt = action.payload.now; c._local.version++; c._local.sync = "pending"; }
        },
        markDeletedLocal(state, action: PayloadAction<{ idOrTemp: string }>) {
            const c = state.byId[action.payload.idOrTemp]; if (c) { c.status = "deleted"; c._local.sync = "pending"; }
        },
        removeLocal(state, action: PayloadAction<{ idOrTemp: string }>) {
            const id = action.payload.idOrTemp; const c = state.byId[id]; if (!c) return;
            const list = state.byPostId[c.postId]; if (list) list.ids = list.ids.filter(x => x !== id);
            delete state.byId[id];
        },
        replaceTempWithServer(state, action: PayloadAction<{ tempId: TempId; server: Omit<Comment, "_local" | "tempId"> }>) {
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
        },
        applyServerItems(state, action: PayloadAction<{ postId: string; items: Omit<Comment, "_local" | "tempId">[]; nextCursor?: string; serverTime?: string }>) {
            const { postId, items, nextCursor, serverTime } = action.payload;
            const list = (state.byPostId[postId] ??= { ids: [] });
            if (nextCursor) list.serverCursor = nextCursor;
            if (serverTime) list.lastServerTime = serverTime;
            for (const dto of items) {
                const existingKey = dto.id && state.byId[dto.id] ? dto.id : undefined;
                if (!existingKey) {
                    // nouvel item serveur
                    state.byId[dto.id!] = { ...dto, _local: { sync: "sent", version: 1 } } as Comment;
                    if (!list.ids.includes(dto.id!)) list.ids.push(dto.id!);
                } else {
                    const local = state.byId[existingKey] as Comment;
                    // si local a une version plus récente (édition en cours), ne pas écraser le body
                    if (new Date(dto.updatedAt).getTime() > new Date(local.updatedAt).getTime() && local._local.sync !== "pending") {
                        state.byId[existingKey] = { ...dto, _local: { ...local._local, sync: "sent" } } as Comment;
                    } else {
                        // garder local (plus récent ou en pending)
                    }
                }
            }
        }
    }
});

export const commentsActions = commentsSlice.actions;

// Outbox state minimal (queue persistée possible)
export interface OutboxState {
    queue: OutboxCommand[];
    isSuspended: boolean;
}
const initialOutbox: OutboxState = { queue: [], isSuspended: false };

export const outboxSlice = createSlice({
    name: "outbox",
    initialState: initialOutbox,
    reducers: {
        enqueue(state, action: PayloadAction<OutboxCommand>) {
            // Squash basique: Edit sur même cible -> garder la dernière
            const cmd = action.payload;
            if (cmd.type === "Comment.Edit") {
                const idx = state.queue.findIndex(c => c.type === "Comment.Edit" && (
                    (c as CommentEditCmd).commentId && (c as CommentEditCmd).commentId === cmd.commentId ||
                    (c as CommentEditCmd).tempId && (c as CommentEditCmd).tempId === cmd.tempId
                ));
                if (idx >= 0) state.queue.splice(idx, 1);
            }
            if (cmd.type === "Comment.Delete") {
                // si un Create existe pour le même tempId -> drop le Create et n'empile pas Delete
                const idxCreate = state.queue.findIndex(c => c.type === "Comment.Create" && (
                    (c as CommentCreateCmd).tempId === cmd.tempId
                ));
                if (idxCreate >= 0) { state.queue.splice(idxCreate, 1); return; }
            }
            state.queue.push(cmd);
        },
        dropByPredicate(state, action: PayloadAction<(c: OutboxCommand) => boolean>) {
            state.queue = state.queue.filter(c => !action.payload(c));
        },
        suspend(state) { state.isSuspended = true; },
        resume(state) { state.isSuspended = false; },
        popNext(state) { state.queue.shift(); },
    }
});

export const outboxActions = outboxSlice.actions;

// ------------------------------------
// UI actions (source d'intentions)
// ------------------------------------
export const uiCommentCreateClicked = createAction<{ postId: string; body: string }>("ui/comment/createClicked");
export const uiCommentEditClicked   = createAction<{ idOrTemp: string; body: string }>("ui/comment/editClicked");
export const uiCommentDeleteClicked = createAction<{ idOrTemp: string }>("ui/comment/deleteClicked");
export const uiCommentsScreenOpened = createAction<{ postId: string }>("ui/comment/screenOpened");
export const uiCommentsScreenClosed = createAction<{ postId: string }>("ui/comment/screenClosed");
export const appBecameForeground    = createAction("app/foreground");

// ------------------------------------
// RootState placeholder
// ------------------------------------
export interface CommentRoot {
    comments: CommentsState;
    outbox: OutboxState;
}

// ------------------------------------
// Helpers
// ------------------------------------
const computeBackoffMs = (attempt: number, base = 1000, cap = 60000) => {
    const exp = Math.min(cap, base * Math.pow(2, attempt));
    const jitter = Math.floor(Math.random() * Math.min(5000, exp / 2));
    return Math.min(cap, exp + jitter);
};

const isNetworkOr5xx = (e: unknown) => {
    const msg = String(e);
    return /Network|timeout|5\d\d/.test(msg);
};

// ------------------------------------
// Listeners (Use Cases)
// ------------------------------------
export const listenerMiddleware = createListenerMiddleware<CommentRoot, AnyAction>();

export function registerCommentUseCases(deps: Deps) {
    const start = listenerMiddleware.startListening;

    // CREATE
    start({
        actionCreator: uiCommentCreateClicked,
        effect: async (action, api) => {
            const tempId = deps.ids.newId();
            const now = deps.clock.nowISO();
            const authorId = deps.selectCurrentUserId(api.getState() as CommentRoot);

            // 1) État optimiste
            api.dispatch(commentsActions.upsertOne({
                tempId, postId: action.payload.postId, authorId,
                body: action.payload.body, createdAt: now, updatedAt: now,
                status: "visible", _local: { sync: "pending", version: 1 }
            } as Comment));

            // 2) Outbox enqueue
            const cmd: CommentCreateCmd = {
                type: "Comment.Create",
                commandId: deps.ids.newId(),
                createdAt: now,
                attempt: 0,
                tempId,
                postId: action.payload.postId,
                body: action.payload.body,
            };
            api.dispatch(outboxActions.enqueue(cmd));

            // 3) Process immédiatement (tick)
            await processOutboxOnce(deps, api);
        }
    });

    // EDIT
    start({
        actionCreator: uiCommentEditClicked,
        effect: async (action, api) => {
            const now = deps.clock.nowISO();
            const state = api.getState() as CommentRoot;
            const c = state.comments.byId[action.payload.idOrTemp];
            if (!c) return;

            // Optimiste
            api.dispatch(commentsActions.editLocal({ idOrTemp: action.payload.idOrTemp, body: action.payload.body, now }));

            // Si Create en attente -> squash dans Create
            const createIdx = (state.outbox.queue || []).findIndex(x => x.type === "Comment.Create" && (x as CommentCreateCmd).tempId === c.tempId);
            if (createIdx >= 0) {
                const create = (state.outbox.queue[createIdx] as CommentCreateCmd);
                // mettre à jour le body du create existant
                const newQueue = [...state.outbox.queue];
                newQueue[createIdx] = { ...create, body: action.payload.body };
                api.dispatch(outboxActions.dropByPredicate(() => true)); // clear all
                for (const q of newQueue) api.dispatch(outboxActions.enqueue(q));
            } else {
                const cmd: CommentEditCmd = {
                    type: "Comment.Edit",
                    commandId: deps.ids.newId(),
                    createdAt: now,
                    attempt: 0,
                    commentId: c.id,
                    tempId: c.tempId,
                    body: action.payload.body,
                };
                api.dispatch(outboxActions.enqueue(cmd));
            }

            await processOutboxOnce(deps, api);
        }
    });

    // DELETE
    start({
        actionCreator: uiCommentDeleteClicked,
        effect: async (action, api) => {
            const state = api.getState() as CommentRoot;
            const c = state.comments.byId[action.payload.idOrTemp]; if (!c) return;

            // Delete sur Create pending -> annuler local + drop du Create
            const idxCreate = state.outbox.queue.findIndex(x => x.type === "Comment.Create" && (x as CommentCreateCmd).tempId === c.tempId);
            if (idxCreate >= 0) {
                api.dispatch(commentsActions.removeLocal({ idOrTemp: action.payload.idOrTemp }));
                api.dispatch(outboxActions.dropByPredicate(cmd => cmd.type === "Comment.Create" && (cmd as CommentCreateCmd).tempId === c.tempId));
                return; // rien à envoyer
            }

            // Optimiste (soft delete visuel)
            api.dispatch(commentsActions.markDeletedLocal({ idOrTemp: action.payload.idOrTemp }));

            const now = deps.clock.nowISO();
            const cmd: CommentDeleteCmd = {
                type: "Comment.Delete",
                commandId: deps.ids.newId(),
                createdAt: now,
                attempt: 0,
                commentId: c.id,
                tempId: c.tempId,
            };
            api.dispatch(outboxActions.enqueue(cmd));
            await processOutboxOnce(deps, api);
        }
    });

    // RETRIEVE — à l'ouverture d'écran + foreground
    start({
        matcher: isAnyOf(uiCommentsScreenOpened, appBecameForeground),
        effect: async (action, api, original) => {
            const postId = (action as any).payload?.postId ?? (api.getState() as any).ui?.currentPostId;
            if (!postId) return;
            const now = deps.clock.nowISO();
            const cmd: CommentRetrieveJob = { type: "Comment.Retrieve", commandId: deps.ids.newId(), createdAt: now, attempt: 0, postId, direction: "since" };
            api.dispatch(outboxActions.enqueue(cmd));

            // Lancer un polling tant que l'écran est ouvert
            const abort = original.signal;
            const poll = async () => {
                while (!abort.aborted) {
                    await processOutboxOnce(deps, api);
                    await new Promise(r => setTimeout(r, 15000));
                }
            };
            poll();
        }
    });

    // Arrêt poll à la fermeture d'écran
    start({ actionCreator: uiCommentsScreenClosed, effect: async (_a, _api, original) => { original.abort(); } });
}

// ------------------------------------
// Exécution d'un tick outbox (processOnce)
// ------------------------------------
async function processOutboxOnce(deps: Deps, api: any) {
    const state: CommentRoot = api.getState();
    if (state.outbox.isSuspended) return;
    const cmd = state.outbox.queue[0];
    if (!cmd) return;

    try {
        switch (cmd.type) {
            case "Comment.Create": {
                const res = await deps.api.createComment({ postId: cmd.postId, body: cmd.body, commandId: cmd.commandId, draftId: cmd.draftId });
                // mapping temp->server
                api.dispatch(commentsActions.replaceTempWithServer({ tempId: cmd.tempId, server: res.comment }));
                api.dispatch(outboxActions.popNext());
                break;
            }
            case "Comment.Edit": {
                // si pas d'id serveur encore, remettre plus tard
                const id = cmd.commentId ?? (api.getState() as CommentRoot).comments.idMap.tempToServer[cmd.tempId!];
                if (!id) { // pas mappé encore -> retry léger
                    scheduleRetry(cmd, api);
                    break;
                }
                const res = await deps.api.editComment({ id, body: cmd.body, commandId: cmd.commandId });
                api.dispatch(commentsActions.upsertOne({ ...(res.comment as any), _local: { sync: "sent", version: (api.getState() as CommentRoot).comments.byId[id]._local.version } }));
                api.dispatch(outboxActions.popNext());
                break;
            }
            case "Comment.Delete": {
                const id = cmd.commentId ?? (api.getState() as CommentRoot).comments.idMap.tempToServer[cmd.tempId!];
                if (!id) { scheduleRetry(cmd, api); break; }
                const res = await deps.api.deleteComment({ id, commandId: cmd.commandId });
                // marquer supprimé côté client
                api.dispatch(commentsActions.upsertOne({ ...(api.getState() as CommentRoot).comments.byId[id], status: res.status, updatedAt: res.updatedAt } as any));
                api.dispatch(outboxActions.popNext());
                break;
            }
            case "Comment.Retrieve": {
                const byPost = (api.getState() as CommentRoot).comments.byPostId[cmd.postId];
                const since = byPost?.lastServerTime;
                const res = await deps.api.retrieveForPost({ postId: cmd.postId, cursor: cmd.cursor, since, limit: 50 });
                api.dispatch(commentsActions.applyServerItems({ postId: cmd.postId, items: res.items, nextCursor: res.nextCursor, serverTime: res.serverTime }));
                api.dispatch(outboxActions.popNext());
                break;
            }
        }
    } catch (e) {
        if (isNetworkOr5xx(e)) {
            scheduleRetry(cmd, api);
        } else {
            // non-retryable -> marquer failed si on a une cible
            if (cmd.type === "Comment.Create") {
                api.dispatch(commentsActions.markFailed({ idOrTemp: cmd.tempId, error: String(e) }));
            } else if (cmd.type === "Comment.Edit" && cmd.commentId) {
                api.dispatch(commentsActions.markFailed({ idOrTemp: cmd.commentId, error: String(e) }));
            } else if (cmd.type === "Comment.Delete" && cmd.commentId) {
                api.dispatch(commentsActions.markFailed({ idOrTemp: cmd.commentId, error: String(e) }));
            }
            api.dispatch(outboxActions.popNext()); // drop le cmd qui a échoué définitivement
        }
    }
}

function scheduleRetry(cmd: OutboxCommand, api: any) {
    // re-enqueue en tête avec attempt+1 et délai
    api.dispatch(outboxActions.popNext());
    const next: OutboxCommand = { ...cmd, attempt: cmd.attempt + 1 } as any;
    const ms = computeBackoffMs(next.attempt, 1000, 60000);
    setTimeout(() => { api.dispatch(outboxActions.enqueue(next)); }, ms);
}

// ------------------------------------
// Bootstrapping
// ------------------------------------
export function configureCommentsModule(deps: Deps) {
    registerCommentUseCases(deps);
    return listenerMiddleware; // à ajouter dans le middleware store
}
