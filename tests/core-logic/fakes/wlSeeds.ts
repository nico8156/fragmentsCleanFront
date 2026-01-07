import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

import {
    appBecameActive,
    appConnectivityChanged,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import {
    authSessionLoaded,
    authSignedOut,
    authSignInSucceeded
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action"; // tu les as déjà

export const seedSignedIn = (store: ReduxStoreWl, p: { userId: string; provider?: string }) => {
    const provider = (p.provider ?? "google") as any;
    const session = { userId: p.userId } as any;

    // 1) signe-in (status signedIn)
    store.dispatch(
        authSignInSucceeded({
            session,
            profile: { provider, userId: p.userId as any },
        }) as any,
    );

    // 2) force un "session loaded" au cas où le reducer qui alimente aState.session est branché ici
    store.dispatch(authSessionLoaded({ session }) as any);
};

export const seedSignedOut = (store: ReduxStoreWl) => {
    store.dispatch(authSignedOut() as any);
};

export const seedOnline = (store: ReduxStoreWl) => {
    store.dispatch(appConnectivityChanged({ online: true } as any));
};

export const seedOffline = (store: ReduxStoreWl) => {
    store.dispatch(appConnectivityChanged({ online: false } as any));
};

export const seedAppActive = (store: ReduxStoreWl) => {
    store.dispatch(appBecameActive() as any);
};
