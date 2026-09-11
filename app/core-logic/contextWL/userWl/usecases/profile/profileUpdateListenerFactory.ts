import { accountGeneration, createListenerMiddleware } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";
import { enqueueCommitted, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds, type ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {
	profileUpdateOptimistic,
	profileUpdateRejectedLocally,
	profileUpdateRequested,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import type { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { nanoid, type TypedStartListening } from "@reduxjs/toolkit";

const normalizeDisplayName = (value: string): string => value.trim().replace(/\s+/g, " ");

const validateDisplayName = (raw: string): string => {
	if (/[\u0000-\u001F\u007F]/.test(raw)) throw new Error("Le nom contient un caractère non autorisé.");
	const normalized = normalizeDisplayName(raw);
	if (normalized.length < 2 || normalized.length > 50) {
		throw new Error("Le nom doit contenir entre 2 et 50 caractères.");
	}
	return normalized;
};

export const profileUpdateListenerFactory = (deps: DependenciesWl) => {
	const middleware = createListenerMiddleware();
	const listen = middleware.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

	listen({
		actionCreator: profileUpdateRequested,
		effect: async ({ payload }, api) => {
			const generation = accountGeneration(api.getState() as any);
			const user = (api.getState() as unknown as RootStateWl).aState.currentUser;
			if (!user) {
				api.dispatch(profileUpdateRejectedLocally({ error: "Le profil n’est pas encore disponible." }));
				return;
			}

			let displayName: string;
			try {
				displayName = validateDisplayName(payload.displayName);
			} catch (error: any) {
				api.dispatch(profileUpdateRejectedLocally({ error: error.message }));
				return;
			}
			if (displayName === user.displayName) return;

			const commandId = deps.helpers.newCommandId();
			const at = deps.helpers.nowIso() as ISODate;
			const outboxId = deps.helpers.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
			if (generation !== accountGeneration(api.getState() as any)) return;

			api.dispatch(profileUpdateOptimistic({ commandId, displayName }));
			api.dispatch(enqueueCommitted({
				id: outboxId,
				item: {
					command: { kind: commandKinds.UserProfileUpdate, commandId, displayName, at },
					undo: {
						kind: commandKinds.UserProfileUpdate,
						displayName: user.displayName,
						version: user.version,
					},
				},
				enqueuedAt: at,
			}));
			api.dispatch(outboxProcessOnce());
		},
	});

	return middleware;
};
