import { accountGeneration, createListenerMiddleware } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";
import {
	accountDeletionAccepted,
	accountDeletionFailed,
	accountDeletionRequested,
	accountDeletionSubmitting,
	authSignOutRequested,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import type { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import type { TypedStartListening } from "@reduxjs/toolkit";

export const accountDeletionListenerFactory = (deps: DependenciesWl) => {
	const middleware = createListenerMiddleware();
	const listen = middleware.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;
	listen({
		actionCreator: accountDeletionRequested,
		effect: async (_action, api) => {
			const state = api.getState() as unknown as RootStateWl;
			if (state.aState.accountDeletionStatus === "submitting") return;
			if (!state.aState.session) {
				api.dispatch(accountDeletionFailed({ error: "Aucune session active." }));
				return;
			}
			const generation = accountGeneration(state);
			const commandId = state.aState.accountDeletionCommandId ?? deps.helpers.newCommandId();
			api.dispatch(accountDeletionSubmitting({ commandId }));
			try {
				const users = deps.gateways.users;
				if (!users) throw new Error("user gateway unavailable");
				await users.requestAccountDeletion({ commandId });
				if (generation !== accountGeneration(api.getState() as any)) return;
				api.dispatch(accountDeletionAccepted());
				api.dispatch(authSignOutRequested());
			} catch {
				if (generation !== accountGeneration(api.getState() as any)) return;
				api.dispatch(accountDeletionFailed({
					error: "Impossible d’enregistrer la suppression. Vérifie ta connexion puis réessaie.",
				}));
			}
		},
	});
	return middleware;
};
