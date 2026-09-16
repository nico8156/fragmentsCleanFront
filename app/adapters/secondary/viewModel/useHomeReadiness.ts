import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootStateWl } from "@/app/store/reduxStoreWl";

/** A short reveal budget only: slow/offline networking never locks navigation. */
export function useHomeReadiness() {
	const online = useSelector((state: RootStateWl) => state.appState.online);
	const bootReady = useSelector((state: RootStateWl) => state.appState.boot.doneWarmup);
	const warming = useSelector((state: RootStateWl) => state.homeImages.warming);
	const catalogueLoading = useSelector((state: RootStateWl) => state.cfState.requests.list.status === "loading");
	const [revealed, setRevealed] = useState(false);
	useEffect(() => {
		if (revealed) return;
		if (!online || (bootReady && !warming && !catalogueLoading)) { setRevealed(true); return; }
	}, [revealed, online, bootReady, warming, catalogueLoading]);
	useEffect(() => { const timer = setTimeout(() => setRevealed(true), 1500); return () => clearTimeout(timer); }, []);
	return { preparing: !revealed && online, catalogueLoading };
}
