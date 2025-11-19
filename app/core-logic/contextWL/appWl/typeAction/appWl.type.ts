export type AppPhase = "cold" | "booting" | "ready" | "background" | "inactive" | "error";
export type ISODate = string & { readonly __brand: "ISODate" };

export interface AppRuntimeState {
    phase: AppPhase;          // état de vie global
    lastActiveAt?: ISODate;   // horodatage utile pour “stale”
    online: boolean;          // réseau
    lastOnlineAt?: ISODate;
    hasCompletedOnboarding: boolean;
    boot: {
        doneHydration: boolean; // redux-persist rehydration ok ?
        doneWarmup: boolean;    // caches chargés (ex: coffees summaries)
        error?: string | null;
    };
}

