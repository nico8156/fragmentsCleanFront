import {
    createAction,
    createListenerMiddleware, isAnyOf,
    TypedStartListening,
} from "@reduxjs/toolkit";
import {AppState, CommentRoot} from "@/app/store/appState";

import {AppDispatch} from "@/app/store/reduxStore";
import {Deps} from "@/app/contexts/comment/domain/commentWLGateway";
import {
    CommentCreateCmd,
    Comment,
    OutboxCommand,
    CommentEditCmd,
    CommentDeleteCmd, CommentRetrieveJob
} from "@/app/contexts/comment/domain/comment.type";
import {processOutboxOnce} from "@/app/adapters/secondary/gateways/comment/commentWL/commentGatewayWL";
import {editLocal, markDeletedLocal, removeLocal} from "@/app/contexts/comment/reducer/comment.reducer";
import {dropByPredicate} from "@/app/contexts/comment/reducer/outbox.reducer";


export const uiCommentEditClicked   = createAction<{ idOrTemp: string; body: string }>("ui/comment/editClicked");
export const uiCommentCreateClicked = createAction<{ postId: string; body: string }>("ui/comment/createClicked");
export const uiCommentDeleteClicked = createAction<{ idOrTemp: string }>("ui/comment/deleteClicked");
export const uiCommentsScreenOpened = createAction<{ postId: string }>("ui/comment/screenOpened");
export const uiCommentsScreenClosed = createAction<{ postId: string }>("ui/comment/screenClosed");
export const appBecameForeground    = createAction("app/foreground");
export const upsertOne=createAction<Comment>('comments/upsertOne');
export const enqueue=createAction<OutboxCommand>('outbox/enqueue');

export const registerCommentUseCasesFactory = (deps: Deps, callback?: () => void) => {
    const registerCommentUseCases = createListenerMiddleware();
    const listener = registerCommentUseCases.startListening as TypedStartListening<AppState, AppDispatch>;

    listener({
        actionCreator: uiCommentCreateClicked,
        effect: async (action, api) => {
            const tempId = deps.ids.newId();
            const now = deps.clock.nowISO();
            const authorId = deps.selectCurrentUserId(api.getState().comments as CommentRoot);

            // 1) État optimiste
            api.dispatch(upsertOne({
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
            api.dispatch(enqueue(cmd));

            await processOutboxOnce(deps, api);
        },
    });
    listener({
        actionCreator:uiCommentEditClicked,
        effect: async (action, api) => {
            const now = deps.clock.nowISO();
            const state = api.getState().comments as CommentRoot;
            const c = state.comments.byId[action.payload.idOrTemp];
            if (!c) return;

            // Optimiste
            api.dispatch(editLocal({ idOrTemp: action.payload.idOrTemp, body: action.payload.body, now }));

            // Si Create en attente -> squash dans Create
            const createIdx = (state.outbox.queue || []).findIndex(x => x.type === "Comment.Create" && (x as CommentCreateCmd).tempId === c.tempId);
            if (createIdx >= 0) {
                const create = (state.outbox.queue[createIdx] as CommentCreateCmd);
                // mettre à jour le body du create existant
                const newQueue = [...state.outbox.queue];
                newQueue[createIdx] = { ...create, body: action.payload.body };
                api.dispatch(dropByPredicate(() => true)); // clear all
                for (const q of newQueue) api.dispatch(enqueue(q));
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
                api.dispatch(enqueue(cmd));
            }
            await processOutboxOnce(deps, api);
        }
    })
    listener({
        actionCreator:uiCommentDeleteClicked,
        effect: async (action, api) => {
            const state = api.getState().comments as CommentRoot;
            const c = state.comments.byId[action.payload.idOrTemp]; if (!c) return;
            // Delete sur Create pending -> annuler local + drop du Create
            const idxCreate = state.outbox.queue.findIndex(x => x.type === "Comment.Create" && (x as CommentCreateCmd).tempId === c.tempId);
            if (idxCreate >= 0) {
                api.dispatch(removeLocal({ idOrTemp: action.payload.idOrTemp }));
                api.dispatch(dropByPredicate(cmd => cmd.type === "Comment.Create" && (cmd as CommentCreateCmd).tempId === c.tempId));
                return; // rien à envoyer
            }
            // Optimiste (soft delete visuel)
            api.dispatch(markDeletedLocal({ idOrTemp: action.payload.idOrTemp }));

            const now = deps.clock.nowISO();
            const cmd: CommentDeleteCmd = {
                type: "Comment.Delete",
                commandId: deps.ids.newId(),
                createdAt: now,
                attempt: 0,
                commentId: c.id,
                tempId: c.tempId,
            };
            api.dispatch(enqueue(cmd));
            await processOutboxOnce(deps, api);
        }
    })
    listener({
        matcher:isAnyOf(uiCommentsScreenOpened, appBecameForeground),
        effect: async (action, api) => {
            const postId = (action as any).payload?.postId ?? (api.getState() as any).ui?.currentPostId;
            if (!postId) return;
            const now = deps.clock.nowISO();
            const cmd: CommentRetrieveJob = { type: "Comment.Retrieve", commandId: deps.ids.newId(), createdAt: now, attempt: 0, postId, direction: "since" };
            api.dispatch(enqueue(cmd));
// Assure un seul poller actif par ouverture/foreground
            api.cancelActiveListeners();
// Démarre un poller lié au cycle de vie du listener
            const task = api.fork(async (forkApi) => {
                while (!forkApi.signal.aborted) {
                    await processOutboxOnce(deps, api);
                    await forkApi.delay(15000);
                }
            });
// Attend la fermeture d'écran puis annule le poller
            await api.take(uiCommentsScreenClosed.match);
            task.cancel();
        }
    })
    return registerCommentUseCases;
};
