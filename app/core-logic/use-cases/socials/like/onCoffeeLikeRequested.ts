import {

    createListenerMiddleware,
    TypedStartListening,
} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {AppDispatch} from "@/app/store/reduxStore";
import {coffeeLiked, coffeeLikeRequested} from "@/app/core-logic/use-cases/socials/like/likeCoffee";
import {OutBoxGateway} from "@/app/core-logic/gateways/outBoxGateway";

export const onCoffeeLikeRequestedFactory = (callback: () => void) => {
    const onCoffeeLikeRequested = createListenerMiddleware();
    const listener = onCoffeeLikeRequested.startListening as TypedStartListening<
        AppState,
        AppDispatch
    >;
    listener({
        actionCreator: coffeeLikeRequested,
        effect: async (action, listenerApi) => {
            const { id, userId, coffeeId } = action.payload;
            // 1) Optimisme local (tu avais déjà coffeeLiked)
            listenerApi.dispatch(coffeeLiked({ id, userId, coffeeId }));
            // 2) Commander l’I/O résiliente via l’outbox
            const { outbox } = listenerApi.extra as { outbox: OutBoxGateway };

            outbox.enqueue({
                type: "Like.Set",
                targetId: coffeeId,
                liked: true,
                likeId: id,
                userId
            } as any);
        },
    });
    return onCoffeeLikeRequested;
};
