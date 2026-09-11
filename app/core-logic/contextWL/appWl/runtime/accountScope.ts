import { createAction, createListenerMiddleware as createReduxListenerMiddleware } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";

export const accountStorageReady = createAction<{ generation: number }>("ACCOUNT/STORAGE_READY");
export const accountStorageFailed = createAction<{ generation: number; error: string }>("ACCOUNT/STORAGE_FAILED");
export const accountStorageRetry = createAction("ACCOUNT/STORAGE_RETRY");
export const accountGeneration = (state: any): number => state.accountScope?.generation ?? 0;
export const accountIsReady = (state: any): boolean => state.accountScope?.ready !== false;

// Capture the session generation at effect entry, including callbacks retained by
// native/HTTP adapters. A -> B -> A must still invalidate the first A's work.
export const createListenerMiddleware: typeof createReduxListenerMiddleware = ((...args: any[]) => {
  const middleware = (createReduxListenerMiddleware as any)(...args);
  const start = middleware.startListening;
  middleware.startListening = (options: any) => start({
    ...options,
    effect: (action: any, api: any) => {
      const generation = accountGeneration(api.getState());
      return options.effect(action, {
        ...api,
        dispatch: (next: any) => generation === accountGeneration(api.getState()) ? api.dispatch(next) : undefined,
      });
    },
  });
  return middleware;
}) as typeof createReduxListenerMiddleware;

export const accountScopedThunks: Middleware = api => next => action => {
	// Screens are gated as well; this protects native callbacks during hydration.
	if (!accountIsReady(api.getState()) && typeof action === "object" && action !== null &&
		"type" in action && String(action.type).startsWith("UI/")) return;
  if (typeof action !== "function") return next(action);
  const generation = accountGeneration(api.getState());
  return next((dispatch: any, getState: any, extra: any) => action(
    (value: any) => generation === accountGeneration(getState()) ? dispatch(value) : undefined,
    getState,
    extra,
  ));
};
