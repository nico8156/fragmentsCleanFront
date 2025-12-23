    import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

    import { AppStateWl } from "@/app/store/appStateWl";

    import {AppDispatchWl} from "@/app/store/reduxStoreWl";
    import {likeReconciled} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
    import {ISODate} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
    import {dropCommitted} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

    export const onLikeAddedAck = createAction<{ commandId: string; targetId: string; server: { count: number; me: boolean; version: number; updatedAt?: ISODate } }>("SERVER/LIKE/ADDED_ACK");
    export const onLikeRemovedAck = createAction<{ commandId: string; targetId: string; server: { count: number; me: boolean; version: number; updatedAt?: ISODate } }>("SERVER/LIKE/REMOVED_ACK");

    const byCmd = (s: AppStateWl, cmdId: string) => (s as any).oState.byCommandId?.[cmdId];

    export const ackLikesListenerFactory = () => {
        const mw = createListenerMiddleware();
        const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

        listen({
            actionCreator: onLikeAddedAck,
            effect: async ({ payload: { commandId, targetId, server } }, api) => {
                console.log("[ACK_LIKES] onLikeAddedAck", { commandId, targetId, server });
                api.dispatch(likeReconciled({ targetId, server }));
                const outboxId = byCmd(api.getState(), commandId);
                if (outboxId) {
                    console.log("[ACK_LIKES] dropCommitted", { commandId, outboxId });
                    api.dispatch(dropCommitted({ commandId }));
                }
            },
        });

        listen({
            actionCreator: onLikeRemovedAck,
            effect: async ({ payload: { commandId, targetId, server } }, api) => {
                console.log("[ACK_LIKES] onLikeRemovedAck", { commandId, targetId, server });
                api.dispatch(likeReconciled({ targetId, server }));
                const outboxId = byCmd(api.getState(), commandId);
                if (outboxId) {
                    console.log("[ACK_LIKES] dropCommitted", { commandId, outboxId });
                    api.dispatch(dropCommitted({ commandId }));
                }
            },
        });

        return mw;
    };
