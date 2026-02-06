import type { RootStateWl } from "@/app/store/reduxStoreWl";

export const selectAppPhase = (s: RootStateWl) => s.appState.phase;

export const selectIsOnline = (s: RootStateWl) => s.appState.online;

export const selectHasCompletedOnboarding = (s: RootStateWl) =>
	s.appState.hasCompletedOnboarding;

export const selectBoot = (s: RootStateWl) => s.appState.boot;
export const selectBootError = (s: RootStateWl) => s.appState.boot.error ?? null;
export const selectIsBootDone = (s: RootStateWl) =>
	Boolean(s.appState?.boot?.doneHydration && s.appState?.boot?.doneWarmup);

export const selectBootReady = (s: RootStateWl): boolean =>
	Boolean(s.appState?.boot?.doneWarmup); // ou doneHydration si tu préfères
