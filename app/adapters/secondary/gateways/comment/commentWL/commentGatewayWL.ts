import { Deps } from "@/app/core-logic/gateways/commentWLGateway";
import {computeBackoffMs, isNetworkOr5xx} from "@/app/contexts/comment/helpers";
import {CommentRoot,OutboxCommand} from "@/app/contexts/comment/comment.type";
import {
    applyServerItems,
    markFailed,
    replaceTempWithServer,
} from "@/app/contexts/comment/reducer/comment.reducer";
import { popNext } from "@/app/contexts/comment/reducer/outbox.reducer";
import {commentCreateOptimisticApplied, enqueue} from "@/app/contexts/comment/write/uiCommentClickedRequested";


export async function processOutboxOnce(deps: Deps, api: any) {
    const state: CommentRoot = api.getState();
    if (state.outbox.isSuspended) return;
    const cmd = state.outbox.queue[0];
    if (!cmd) return;

    try {
        switch (cmd.type) {
            case "Comment.Create": {
                const res = await deps.api.createComment({ postId: cmd.postId, body: cmd.body, commandId: cmd.commandId, draftId: cmd.draftId });
                // mapping temp->server
                api.dispatch(replaceTempWithServer());
                api.dispatch(popNext());
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
                api.dispatch(commentCreateOptimisticApplied({ ...(res.comment as any), _local: { sync: "sent", version: (api.getState() as CommentRoot).comments.byId[id]._local.version } }));
                api.dispatch(popNext());
                break;
            }
            case "Comment.Delete": {
                const id = cmd.commentId ?? (api.getState() as CommentRoot).comments.idMap.tempToServer[cmd.tempId!];
                if (!id) { scheduleRetry(cmd, api); break; }
                const res = await deps.api.deleteComment({ id, commandId: cmd.commandId });
                // marquer supprimé côté client
                api.dispatch(commentCreateOptimisticApplied({ ...(api.getState() as CommentRoot).comments.byId[id], status: res.status, updatedAt: res.updatedAt } as any));
                api.dispatch(popNext());
                break;
            }
            case "Comment.Retrieve": {


                const res = await deps.api.retrieveForPost({ postId: cmd.postId, cursor: cmd.cursor, since, limit: 50 });
                api.dispatch(applyServerItems({ postId: cmd.postId, items: res.items, nextCursor: res.nextCursor, serverTime: res.serverTime }));
                api.dispatch(popNext());
                break;
            }
        }
    } catch (e) {
        if (isNetworkOr5xx(e)) {
            scheduleRetry(cmd, api);
        } else {
            // non-retryable -> marquer failed si on a une cible
            if (cmd.type === "Comment.Create") {
                api.dispatch(markFailed({ idOrTemp: cmd.tempId, error: String(e) }));
            } else if (cmd.type === "Comment.Edit" && cmd.commentId) {
                api.dispatch(markFailed({ idOrTemp: cmd.commentId, error: String(e) }));
            } else if (cmd.type === "Comment.Delete" && cmd.commentId) {
                api.dispatch(markFailed({ idOrTemp: cmd.commentId, error: String(e) }));
            }
            api.dispatch(popNext()); // drop le cmd qui a échoué définitivement
        }
    }
}

function scheduleRetry(cmd: OutboxCommand, api: any) {
    // re-enqueue en tête avec attempt+1 et délai
    api.dispatch(popNext());
    const next: OutboxCommand = { ...cmd, attempt: cmd.attempt + 1 } as any;
    const ms = computeBackoffMs(next.attempt, 1000, 60000);
    setTimeout(() => { api.dispatch(enqueue(next)); }, ms);
}

