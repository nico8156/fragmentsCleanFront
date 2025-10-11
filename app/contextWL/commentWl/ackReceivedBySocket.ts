import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {createReconciled, dropCommitted} from "@/app/contextWL/outboxWl/processOutbox";

export const onCommentCreatedAck = createAction<{commandId: string; tempId: string; server: { id: string; createdAt: string; version: number }}>("SERVER/COMMENT/ON_COMMENT_CREATED_ACK")

export const ackListenerFactory =  (deps:DependenciesWl, callback?:() => void) => {
    const ackReceivedBySocketUseCase = createListenerMiddleware()
    const listener = ackReceivedBySocketUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;
    listener({
        actionCreator: onCommentCreatedAck,
        effect: async (action, api) => {
            const { commandId, tempId, server } = action.payload;

            const outboxId = (api.getState()as any).oState.byCommandId?.[commandId];
            //console.log("outboxId", outboxId)
            const {queue} = (api.getState() as any).oState
            //console.log("queue", queue)
            // Si pas trouvé, peut-être déjà traité (idempotent)
            if (outboxId) {
                api.dispatch(
                    createReconciled({
                        tempId,
                        server,
                    })
                );
                api.dispatch(dropCommitted({ id: outboxId }));
                if (callback) {
                    callback();
                    return;
                }

            } else {
                // cas idempotent: faire seulement le reconcile si nécessaire
                api.dispatch(createReconciled({ tempId, server }));
                if (callback) {
                    callback();
                    return;
                }
                return

            }

        },
    })

    return ackReceivedBySocketUseCase
}