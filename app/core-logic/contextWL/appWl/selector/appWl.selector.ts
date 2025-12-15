import {RootStateWl} from "@/app/store/reduxStoreWl";

export const selectHasCompletedOnboarding = (state:RootStateWl) => state.appState.hasCompletedOnboarding;

export const isOnline =(state:RootStateWl) => state.appState.online;