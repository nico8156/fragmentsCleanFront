import {
    createAction,
    createListenerMiddleware, isAnyOf,
    TypedStartListening,
} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {AppDispatch} from "@/app/store/reduxStore";
import {nanoid} from "nanoid";
import {Gateways} from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import {backoff} from "@/app/adapters/secondary/gateways/outBoxGateway/deps";

export const likeSetRequested= createAction<{ targetId: string; liked: boolean }>('Like.SetRequested');
export const likeOptimisticApplied = createAction<{ targetId: string; liked: boolean; now: number }>('Like.OptimisticApplied');
export const likeEnqueued = createAction<{ type: string; commandId: string; targetId: string; liked: boolean }>('Like.Enqueued');
export const likeRemoved= createAction('Like.Removed');
export const likeConfirmed= createAction<{ commandId: string; targetId: string; liked: boolean }>('Like.Confirmed');
export const likeBumped= createAction<{ commandId: string; error: string }>('Like.Bumped');

export const onCoffeeLikeRequestedFactory = (callback: () => void) => {
    const onCoffeeLikeRequested = createListenerMiddleware<AppState, any, Partial<Gateways>>();
    const listener = onCoffeeLikeRequested.startListening as TypedStartListening<AppState, AppDispatch>;
    listener({
        actionCreator: likeSetRequested,
        effect: async (action, api) => {
            const prev = (api.getState() as any).likes?.byId?.[action.payload.targetId]?.liked ?? false;
            api.dispatch(likeOptimisticApplied({ targetId: action.payload.targetId, liked: action.payload.liked, now: Date.now() }));

            const commandId = nanoid();
            api.dispatch(likeEnqueued({ type:'Like.Set', commandId, targetId: action.payload.targetId, liked: action.payload.liked }));
            api.dispatch({ type: 'likes/PROCESS' }); // déclenche le processeur
            // on stocke prev dans un map si tu préfères, ou on le recalcule côté reducer en cas d’échec
            (api as any).prevLikedMap ??= new Map();
            (api as any).prevLikedMap.set(commandId, prev);
        },
    });

    let isProcessing = false;
    listener({
        matcher: isAnyOf(likeEnqueued),
        effect: async (action, api) => {
            if (isProcessing) return;
            isProcessing = true;
            try {
                //const gw = api.extra?.gateways.likeGateway;
                const { likeGateways } = api.extra as { likeGateways: LikeGateway };
                if (!likeGateways) return;

                const items = selectLikesOutbox(api.getState());
                for (const cmd of items) {
                    try {
                        const { count } = await likeGateways.set({ targetId: cmd.targetId, liked: cmd.liked, commandId: cmd.commandId });
                        api.dispatch(likeRemoved({ commandId: cmd.commandId }));
                        api.dispatch(likeConfirmed({ targetId: cmd.targetId, serverCount: count }));
                    } catch (e) {
                        const msg = String(e);
                        const retryable = /ECONN|ETIMEDOUT|timeout|5\d\d/.test(msg);
                        if (retryable) {
                            api.dispatch(likeBumped({ commandId: cmd.commandId, error: msg }));
                            await sleep(backoff(cmd.attempts));
                        } else {
                            // rollback vers l’état précédent pour CE commandId
                            const prevLiked = (api as any).prevLikedMap?.get(cmd.commandId);
                            if (typeof prevLiked === 'boolean') {
                                api.dispatch(likeFailedReverted({ targetId: cmd.targetId, previousLiked: prevLiked }));
                            }
                            api.dispatch(likeFailed({ commandId: cmd.commandId, error: msg }));
                        }
                    }
                    await sleep(0);
                }
            } finally {
                isProcessing = false;
            }
        }
    })

    return onCoffeeLikeRequested;
};
