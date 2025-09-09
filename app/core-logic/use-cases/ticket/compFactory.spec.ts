import { initReduxStore, ReduxStore } from "../../../store/reduxStore.ts";
import { afterEach, beforeEach } from "vitest";
import { FakeQuestionGateway } from "../../../adapters/secondary/gateways/fakeQuestionGateway.ts";
import { onAnswerSubmittedFactory } from "./onAnswerSubmitted.ts";
import { Question } from "../../../store/appState.ts";
import { answerSubmitted } from "../answer-submission/submitAnswer.ts";
import { questionRetrieved } from "./retrieveQuestion.ts";

describe("On answer submitted", () => {
    let store: ReduxStore;
    let questionGateway: FakeQuestionGateway;
    const nextQuestion: Question = {
        id: "2",
        label: "What is the capital of France?",
        possibleAnswers: { A: "Paris", B: "London", C: "Berlin", D: "Madrid" },
    };

    beforeEach(() => {
        questionGateway = new FakeQuestionGateway();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it("when not last question, should retrieve the next question upon a correct answer", () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualQuestion(nextQuestion),
                resolve,
                reject,
            );
            questionGateway.nextQuestion = nextQuestion;
            store.dispatch(answerSubmitted({ status: true, correctAnswer: "A" }));
            vi.advanceTimersByTime(2000);
        });
    });

    it("when not last question, should NOT retrieve the next question upon a wrong answer", () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualQuestion(null),
                resolve,
                reject,
            );
            questionGateway.nextQuestion = nextQuestion;
            store.dispatch(answerSubmitted({ status: false, correctAnswer: "A" }));
            vi.advanceTimersByTime(2000);
        });
    });

    it("when last question, should NOT retrieve another question upon a correct answer", () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualQuestion(null),
                resolve,
                reject,
                ["10 €"],
            );
            questionGateway.nextQuestion = nextQuestion;
            store.dispatch(answerSubmitted({ status: true, correctAnswer: "A" }));
            vi.advanceTimersByTime(2000);
        });
    });

    it("when last question, should discard the last question upon a game winning", () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => {
                    expectActualQuestion(null);
                },
                resolve,
                reject,
                ["10 €"],
            );
            questionGateway.nextQuestion = nextQuestion;
            store.dispatch(questionRetrieved(aQuestion));
            store.dispatch(answerSubmitted({ status: true, correctAnswer: "A" }));
            vi.advanceTimersByTime(2000);
        });
    });

    const createOnAnswerSubmittedListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (value: unknown) => void,
    ) => {
        return onAnswerSubmittedFactory(() => {
            try {
                doExpectations();
                resolve({});
            } catch (error) {
                reject(error);
            }
        }).middleware;
    };

    const expectActualQuestion = (question: Question | null) => {
        expect(store.getState().questionRetrieval.data).toEqual(question);
    };

    const createReduxStoreWithListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: () => void,
        pyramidValues: string[] = ["10 €", "20 €"],
    ) => {
        return initReduxStore({
            gateways: {
                questionGateway,
            },
            pyramidValues,
            listeners: [
                createOnAnswerSubmittedListener(doExpectations, resolve, reject),
            ],
        });
    };

    const aQuestion: Question = {
        id: "1",
        label: "What is the capital of France?",
        possibleAnswers: { A: "Paris", B: "London", C: "Berlin", D: "Madrid" },
    };
});
