import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { dropCommitted } from "@/app/contextWL/outboxWl/processOutbox"; // ton action existante
import { AppStateWl } from "@/app/store/appStateWl";
import {ISODate} from "@/app/contextWL/likeWl/typeAction/likeWl.type";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {likeReconciled} from "@/app/contextWL/likeWl/typeAction/likeWl.action";

export const onLikeAddedAck = createAction<{ commandId: string; targetId: string; server: { count: number; me: boolean; version: number; updatedAt?: ISODate } }>("SERVER/LIKE/ADDED_ACK");
export const onLikeRemovedAck = createAction<{ commandId: string; targetId: string; server: { count: number; me: boolean; version: number; updatedAt?: ISODate } }>("SERVER/LIKE/REMOVED_ACK");

const byCmd = (s: AppStateWl, cmdId: string) => (s as any).oState.byCommandId?.[cmdId];

export const ackLikesListenerFactory = () => {
    const mw = createListenerMiddleware();
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: onLikeAddedAck,
        effect: async ({ payload: { commandId, targetId, server } }, api) => {
            api.dispatch(likeReconciled({ targetId, server }));
            const outboxId = byCmd(api.getState(), commandId);
            if (outboxId) api.dispatch(dropCommitted({ id: outboxId }));
        },
    });

    listen({
        actionCreator: onLikeRemovedAck,
        effect: async ({ payload: { commandId, targetId, server } }, api) => {
            api.dispatch(likeReconciled({ targetId, server }));
            const outboxId = byCmd(api.getState(), commandId);
            if (outboxId) api.dispatch(dropCommitted({ id: outboxId }));
        },
    });

    return mw;
};
