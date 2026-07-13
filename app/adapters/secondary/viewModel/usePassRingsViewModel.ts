import { useMemo } from "react";
import { useSelector } from "react-redux";

import { buildPassViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { selectCurrentUser, selectEffectiveUserId } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import type { RootStateWl } from "@/app/store/reduxStoreWl";

export const usePassRingsViewModel = () => {
	const user = useSelector(selectCurrentUser);
	const effectiveUserId = useSelector(selectEffectiveUserId);
	const entitlements = useSelector((state: RootStateWl) =>
		effectiveUserId ? state.enState.byUser[String(effectiveUserId)] : undefined,
	);

	return useMemo(
		() => buildPassViewModel({ user, entitlements }),
		[user, entitlements],
	);
};
