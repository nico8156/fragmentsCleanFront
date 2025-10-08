import {createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {outboxProcessOnce} from "@/app/contextWL/commentWl/cc";


export const processOutboxFactory = (deps:DependenciesWl, callback?: () => void) => {
    const processOutboxUseCase = createListenerMiddleware();
    const listener = processOutboxUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator:outboxProcessOnce,
        effect:async (action, api)=>{

        }
    })


    return processOutboxUseCase;
}