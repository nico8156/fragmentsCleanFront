import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import { loadStudioCafes } from "@/app/core-logic/contextWL/studioWl/usecases/studioArticleUseCases";

export function useStudioCafes() {
	const dispatch = useDispatch<any>();
	const cafes = useSelector((s: RootStateWl) => s.stState.cafes);
	const [adminToken, setAdminToken] = useState("");

	useEffect(() => {
		if (adminToken.trim() && cafes.status === "idle") {
			dispatch(loadStudioCafes({ adminToken: adminToken.trim() }));
		}
	}, [adminToken, cafes.status, dispatch]);

	return {
		adminToken,
		setAdminToken,
		cafes: cafes.items,
		status: cafes.status,
		error: cafes.error,
		refresh: () => adminToken.trim() && dispatch(loadStudioCafes({ adminToken: adminToken.trim() })),
	};
}
