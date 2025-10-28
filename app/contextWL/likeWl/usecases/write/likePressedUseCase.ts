import { createListenerMiddleware, createAction, TypedStartListening } from "@reduxjs/toolkit";
import { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted, outboxProcessOnce } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {CommandId, commandKinds, ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";
import {likeOptimisticApplied, unlikeOptimisticApplied} from "@/app/contextWL/likeWl/typeAction/likeWl.action";


export const uiLikeToggleRequested = createAction<{ targetId: string }>("UI/LIKE/TOGGLE_REQUESTED");

export const likeToggleUseCaseFactory = (deps: DependenciesWl) => {
    const mw = createListenerMiddleware();
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: uiLikeToggleRequested,
        effect: async ({ payload: { targetId } }, api) => {
            const state: any = api.getState();
            const me = state.lState.byTarget?.[targetId]?.me ?? false;
            const outboxId  = deps.helpers?.getCommandIdForTests?.() ?? `obx_${crypto.randomUUID?.() ?? Math.random()}`;
            const commandId = `cmd_${crypto.randomUUID?.() ?? Math.random()}` as CommandId;
            const at        = deps.helpers?.nowIso?.() ?? new Date().toISOString();
            //const userId    = deps.helpers?.currentUserId?.() ?? "me";

            if (!deps.gateways.likes) return;
            if (!me) {
                // LIKE
                api.dispatch(likeOptimisticApplied({ targetId, clientAt: at as ISODate}));
                api.dispatch(enqueueCommitted({
                    id: outboxId,
                    item: {
                        command: { kind: commandKinds.LikeAdd, commandId, targetId, at : at as ISODate},
                        undo:    { kind: commandKinds.LikeAdd, targetId, prevCount: state.lState.byTarget[targetId]?.count ?? 0, prevMe: false, prevVersion: state.lState.byTarget[targetId]?.version },
                    },
                    enqueuedAt: at,
                }));
            } else {
                // UNLIKE
                api.dispatch(unlikeOptimisticApplied({ targetId, clientAt: at as ISODate}));
                api.dispatch(enqueueCommitted({
                    id: outboxId,
                    item: {
                        command: { kind: commandKinds.LikeRemove, commandId, targetId, at: at as ISODate},
                        undo:    { kind: commandKinds.LikeRemove, targetId, prevCount: state.lState.byTarget[targetId]?.count ?? 0, prevMe: true, prevVersion: state.lState.byTarget[targetId]?.version },
                    },
                    enqueuedAt: at,
                }));
            }
            api.dispatch(outboxProcessOnce());
        },
    });

    return mw;
};
