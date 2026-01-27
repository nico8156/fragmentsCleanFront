import { v4 as uuidv4 } from "uuid";

import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import type { Helpers } from "@/app/store/appStateWl";
import { parseToCommandId } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const createHelpers = (getStore: () => ReduxStoreWl): Helpers => ({
	nowIso: () => new Date().toISOString(),
	currentUserId: () => {
		const a = getStore().getState().aState;
		return a?.session?.userId ?? a?.currentUser?.id ?? "anonymous";
	},
	currentUserProfile: () => {
		const u = getStore().getState().aState.currentUser;
		if (!u) return null;

		return {
			// displayName est optionnel dans HelpersCore => OK même si undefined
			displayName: u.displayName,
			// avatarUrl doit être string|undefined => on normalise (pas de null)
			avatarUrl: u.avatarUrl ?? undefined,
		};
	},
	newCommandId: () => parseToCommandId(uuidv4()),
});
