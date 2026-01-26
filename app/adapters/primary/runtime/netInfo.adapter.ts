import { appConnectivityChanged } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";
import NetInfo from "@react-native-community/netinfo";

type NetInfoAdapterOptions = {
	debounceMs?: number;
	/** dispatch un appConnectivityChanged initial (recommandé) */
	dispatchInitial?: boolean;
};

type DispatchCapableStore = Pick<ReduxStoreWl, "dispatch">;

const computeOnline = (state: {
	isConnected: boolean | null | undefined;
	isInternetReachable: boolean | null | undefined;
}) => {
	const connected = Boolean(state.isConnected);
	const reachable = state.isInternetReachable ?? state.isConnected; // fallback RN/Android
	return Boolean(connected && reachable);
};

export function mountNetInfoAdapter(
	store: DispatchCapableStore,
	options?: NetInfoAdapterOptions,
) {
	let lastOnline: boolean | undefined = undefined;
	let timer: ReturnType<typeof setTimeout> | null = null;

	const debounceMs = options?.debounceMs ?? 500;
	const dispatchInitial = options?.dispatchInitial ?? true;

	const clearTimer = () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	};

	const scheduleConnectivityChanged = (online: boolean) => {
		clearTimer();
		timer = setTimeout(() => {
			store.dispatch(appConnectivityChanged({ online }));
			timer = null;
		}, debounceMs);
	};

	// 1) Event listener (source de vérité)
	const unsub = NetInfo.addEventListener((state) => {
		const online = computeOnline(state);

		// premier event => initialise + (optionnel) dispatch initial
		if (lastOnline === undefined) {
			lastOnline = online;
			if (dispatchInitial) {
				store.dispatch(appConnectivityChanged({ online }));
			}
			return;
		}

		if (online !== lastOnline) {
			scheduleConnectivityChanged(online);
			lastOnline = online;
		}
	});

	// 2) Fetch (fallback) : si aucun event n’arrive immédiatement
	NetInfo.fetch()
		.then((s) => {
			const online = computeOnline(s);
			if (lastOnline === undefined) {
				lastOnline = online;
				if (dispatchInitial) {
					store.dispatch(appConnectivityChanged({ online }));
				}
			}
		})
		.catch(() => {
			if (lastOnline === undefined) {
				lastOnline = false;
				if (dispatchInitial) {
					store.dispatch(appConnectivityChanged({ online: false }));
				}
			}
		});

	return () => {
		clearTimer();
		unsub();
	};
}
