import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";

import { statusTypes, type OutboxRecord } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { selectOutboxById } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";


import {
    dropCommitted,
    markAwaitingAck,
    markFailed,
    outboxProcessOnce,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {
    outboxAwaitingAckAdded,
    outboxWatchdogTick
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";
import {appBecameActive, appConnectivityChanged} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

const assertAction = (a: any, name: string) => {
    if (!a || typeof a.type !== "string" || typeof a.match !== "function") {
        throw new Error(`[outboxWatchdogFactory] invalid action import: ${name}`);
    }
};

assertAction(appBecameActive, "appBecameActive");
assertAction(appConnectivityChanged, "appConnectivityChanged");
assertAction(outboxAwaitingAckAdded, "outboxAwaitingAckAdded");
assertAction(outboxWatchdogTick, "outboxWatchdogTick");

const isSignedIn = (s: RootStateWl) => s.aState?.status === "signedIn";

const parseIsoMs = (iso?: string) => {
    if (!iso) return undefined;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : undefined;
};

type WatchdogDeps = {
    gateways: DependenciesWl["gateways"];
    tickMs?: number;
    enableTimer?: boolean;
};

const getCommandIdFromRecord = (rec: OutboxRecord): string | undefined => {
    const cmd = (rec.item as any)?.command;
    return cmd?.commandId;
};

export const outboxWatchdogFactory = (deps: WatchdogDeps) => {
    const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
    const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    const startTimer = (dispatch: AppDispatchWl) => {
        if (!deps.enableTimer) return;
        if (timer) return;
        const every = deps.tickMs ?? 20_000;
        timer = setInterval(() => dispatch(outboxWatchdogTick()), every);
    };

    const stopTimer = () => {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
    };

    const pickExpiredAwaitingAck = (byId: Record<string, OutboxRecord>, now: number): OutboxRecord | undefined => {
        // ✅ typage: byId values => OutboxRecord, plus de `{}` => plus d'erreur TS2339
        return Object.values(byId).find((rec) => {
            if (rec.status !== statusTypes.awaitingAck) return false;
            const due = parseIsoMs(rec.nextCheckAt);
            if (!due) return false;
            return due <= now;
        });
    };

    const runOnce = async (api: { getState: () => RootStateWl; dispatch: AppDispatchWl }) => {
        if (inFlight) return;
        inFlight = true;

        try {
            const state = api.getState();
            if (!isSignedIn(state)) return;
            if (!selectIsOnline(state)) return;

            const commandStatus = deps.gateways?.commandStatus;
            if (!commandStatus) {
                console.warn("[OUTBOX_WD] missing gateways.commandStatus")
                return
            }

            const byId = selectOutboxById(state) as Record<string, OutboxRecord>;
            const now = Date.now();

            const rec = pickExpiredAwaitingAck(byId, now);
            if (!rec) return;

            const commandId = getCommandIdFromRecord(rec);
            if (!commandId) {
                api.dispatch(markFailed({ id: rec.id, error: "missing commandId for awaitingAck record" }));
                return;
            }

            console.log("[OUTBOX_WD] checking status", { id: rec.id, commandId });

            const verdict = await commandStatus.getStatus(commandId);

            if (verdict.status === "APPLIED") {
                console.log("[OUTBOX_WD] applied => drop", { commandId });
                api.dispatch(dropCommitted({ commandId }));
                api.dispatch(outboxProcessOnce());
                return;
            }

            if (verdict.status === "REJECTED") {
                console.log("[OUTBOX_WD] rejected => fail+drop", { commandId, reason: verdict.reason });
                api.dispatch(markFailed({ id: rec.id, error: verdict.reason ?? "rejected" }));
                api.dispatch(dropCommitted({ commandId }));
                return;
            }

            // PENDING => replanifie prochain check
            const next = new Date(Date.now() + 5_000).toISOString();
            api.dispatch(markAwaitingAck({ id: rec.id, ackBy: next }));
        } finally {
            inFlight = false;
        }
    };

    // triggers
    listen({
        actionCreator: appBecameActive,
        effect: async (_, api) => {
            startTimer(api.dispatch);
            await runOnce(api);
        },
    });

    listen({
        actionCreator: appConnectivityChanged,
        effect: async (action, api) => {
            if (action.payload.online) {
                startTimer(api.dispatch);
                await runOnce(api);
            } else {
                stopTimer();
            }
        },
    });

    listen({
        actionCreator: outboxAwaitingAckAdded,
        effect: async (_, api) => {
            await runOnce(api);
        },
    });

    listen({
        actionCreator: outboxWatchdogTick,
        effect: async (_, api) => {
            await runOnce(api);
        },
    });

    return mw.middleware;
};
