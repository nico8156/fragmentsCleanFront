import {
    createAction,
    createListenerMiddleware, isAnyOf,
    TypedStartListening,
} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {nanoid} from "nanoid";
import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import {backoff} from "@/app/adapters/secondary/gateways/outBoxGateway/deps";
import {AppDispatch} from "@/app/store/reduxStore";
import {CommandId, LikeCmd} from "@/app/contexts/like/like.type";

export const likeSetRequested= createAction<{ targetId: string; liked: boolean }>('Like.SetRequested');
export const likeOptimisticApplied = createAction<{ targetId: string; liked: boolean; now: number }>('Like.OptimisticApplied');
export const likeEnqueued = createAction<Omit<LikeCmd, 'attempts'>>('Like.Enqueued');
export const likeRemoved= createAction<{commandId: string}>('Like.Removed');
export const likeConfirmed= createAction<{ targetId: string;serverCount: number }>('Like.Confirmed');
export const likeBumped= createAction<{ commandId: string; error: string }>('Like.Bumped');
export const likeFailed= createAction<{ commandId: CommandId; error: string }>('Like.Failed');
export const likeFailedReverted= createAction<{ targetId: string; previousLiked: boolean }>('Like.FailedReverted');
export const startLikeProcessing = createAction('Like.StartProcessing');



const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const onCoffeeLikeRequestedFactory = (deps: { likeGateway: LikeGateway }, callback?: () => void) => {
    const onCoffeeLikeRequested = createListenerMiddleware();
    const listener = onCoffeeLikeRequested.startListening as TypedStartListening<AppState, AppDispatch>;

    listener({
        actionCreator: likeSetRequested,
        effect: async (action, api) => {

            const prev = (api.getState() as any).likes?.byId?.[action.payload.targetId]?.liked ?? false;
            api.dispatch(likeOptimisticApplied({ targetId: action.payload.targetId, liked: action.payload.liked, now: Date.now() }));

            const commandId = nanoid();
            api.dispatch(likeEnqueued({ type:'Like.Set', commandId, targetId: action.payload.targetId, liked: action.payload.liked }));

            api.dispatch(startLikeProcessing());

            (api as any).prevLikedMap ??= new Map();
            (api as any).prevLikedMap.set(commandId, prev);
        },
    });

    let isProcessing = false;

    listener({
        matcher: isAnyOf(likeEnqueued, startLikeProcessing),
        effect: async (action, api) => {
            if (isProcessing) return;
            isProcessing = true;
            try {
                let { likeGateway } = deps;
                if (!likeGateway) return;


                for (const cmd of items) {

                    if (cmd.type !== "Like.Set")continue;

                    try {
                        const { count } = await deps.likeGateway.set({
                            targetId: cmd.targetId,
                            liked: cmd.liked,
                            commandId: cmd.commandId,
                        });
                        api.dispatch(likeRemoved({ commandId: cmd.commandId }));
                        api.dispatch(likeConfirmed({ targetId: cmd.targetId, serverCount: count }));
                        callback?.();

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
                                api.dispatch(likeFailedReverted({
                                    targetId: cmd.targetId,
                                    previousLiked: prevLiked
                                }));
                            }
                            api.dispatch(likeFailed({commandId: cmd.commandId, error: msg}));
                            callback?.();
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
