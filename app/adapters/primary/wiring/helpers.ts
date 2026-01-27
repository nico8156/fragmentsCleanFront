import { v4 as uuidv4 } from "uuid";

import type { DependenciesWl } from "@/app/store/appStateWl";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

export const createHelpers = (getStore: () => ReduxStoreWl): DependenciesWl["helpers"] => ({
	nowIso: () => new Date().toISOString() as any, // ou parseToISODate si requis
	currentUserId: () => {
		const a = getStore().getState().aState;
		return a?.session?.userId ?? a?.currentUser?.id ?? "anonymous";
	},
	currentUserProfile: () => {
		const u = getStore().getState().aState.currentUser;
		if (!u) return null;

		return {
			displayName: u.displayName,                 // si parfois undefined, c’est OK
			avatarUrl: u.avatarUrl ?? undefined,        // ✅ pas de null
		};
	},
	newCommandId: () => uuidv4() as any,            // ou parseToCommandId
});
