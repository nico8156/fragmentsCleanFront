import {
    createAction,
    createListenerMiddleware,
    TypedStartListening,
} from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState.ts";
import { AppDispatch } from "../../../store/reduxStore.ts";
import { answerSubmitted } from "../answer-submission/submitAnswer.ts";
import { retrieveQuestion } from "./retrieveQuestion.ts";

export const hasWonTheGame = createAction("HAS_WON_THE_GAME");

export const onAnswerSubmittedFactory = (callback: () => void) => {
    const onAnswerSubmitted = createListenerMiddleware();
    const listener = onAnswerSubmitted.startListening as TypedStartListening<
        AppState,
        AppDispatch
    >;
    listener({
        actionCreator: answerSubmitted,
        effect: async (action, listenerApi) => {
            setTimeout(async () => {
                const { currentPositionIndex } = listenerApi.getState().pyramidManagement;
                const { length: pyramidLength } = listenerApi.getState().pyramidContent;
                const isLastQuestion = currentPositionIndex === pyramidLength - 1;

                if (action.payload.status) {
                    if (isLastQuestion) {
                        listenerApi.dispatch(hasWonTheGame());
                    } else {
                        await listenerApi.dispatch(retrieveQuestion());
                    }
                }
                callback();
            }, 2000);
        },
    });
    return onAnswerSubmitted;
};
