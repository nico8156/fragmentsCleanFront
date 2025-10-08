import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {outboxProcessOnce} from "@/app/contextWL/commentWl/cc";

export const removeFromQueue = createAction<{ id: string }>("OUTBOX/REMOVE_FROM_QUEUE")
export const markProcessing = createAction<{id:string}>("OUTBOX/MARK_PROCESSING")
export const createReconciled = createAction<{ tempId: string; server: { id: string; createdAt: string; version: number }}>("COMMENT/CREATE_RECONCILED")
export const markSucceeded = createAction<{ id: string }>("OUTBOX/MARK_SUCCEEDED")
export const markFailed = createAction<{id: string, error: string}>("OUTBOX/MARK_FAILED")
export const createRollback = createAction<{ tempId: string; targetId: string; parentId?: string }>("COMMENT/CREATE_ROLLBACK")

export const processOutboxFactory = (deps:DependenciesWl, callback?: () => void) => {
    const processOutboxUseCase = createListenerMiddleware();
    const listener = processOutboxUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator:outboxProcessOnce,
        effect:async (action, api)=>{
            const state: any = api.getState();
            const queue: string[] = state.outbox.queue ?? [];
            const id = queue[0];
            if (!id) return; // rien à faire

            const record = state.outbox.byId[id];
            if (!record) {
                // garde-fou: nettoie si incohérent
                api.dispatch(removeFromQueue({ id }));
                return;
            }

            // on ne traite que les "queued" (si déjà processing, on s'arrête)
            if (record.status !== "queued") return;
            if(!deps.gateways.comments) return;

            api.dispatch(markProcessing({ id }));

            try {
                const cmd = record.item.command;
                switch (cmd.kind) {
                    case "Comment.Create": {
                        await deps.gateways.comments.create({
                                commandId: cmd.commandId,
                                targetId: cmd.targetId,
                                parentId: cmd.parentId,
                                body: cmd.body,
                        })
                        //TODO a trasnferer dans le listener du retour par socket !!!!!!!
                        // const res = await deps.gateways.comments.create({
                        //     commandId: cmd.commandId,
                        //     targetId: cmd.targetId,
                        //     parentId: cmd.parentId,
                        //     body: cmd.body,
                        // })
                        // //en fait le reconcile se fait sur le retour du socket !
                        // // succès: reconcile + marquer succeeded + retirer de la file
                        // api.dispatch(
                        //     createReconciled({
                        //         tempId: cmd.tempId,
                        //         server: { id: res.id, createdAt: res.createdAt, version: res.version },
                        //     })
                        // );
                        api.dispatch(markSucceeded({ id }));
                        api.dispatch(removeFromQueue({ id }));
                        break;
                    }
                    default:
                        // commande non supportée: on “fail & drop”
                        api.dispatch(markFailed({ id, error: "Unsupported command" }));
                        api.dispatch(removeFromQueue({ id }));
                }
            } catch (e: any) {
                // échec: rollback + fail + drop (simple pour l’instant)
                const cmd = record.item.command;
                if (cmd.kind === "Comment.Create") {
                    api.dispatch(
                        createRollback({
                            tempId: cmd.tempId,
                            targetId: cmd.targetId,
                            parentId: cmd.parentId,
                        })
                    );
                }
                api.dispatch(markFailed({ id, error: String(e?.message ?? e) }));
                api.dispatch(removeFromQueue({ id }));
            }
        }
    })
    return processOutboxUseCase;
}