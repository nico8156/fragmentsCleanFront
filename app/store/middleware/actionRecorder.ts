// tests/testUtils/actionsRecorder.ts
import type {Middleware} from "@reduxjs/toolkit";

export type RecordedAction = { type: string; payload?: unknown };

export function createActionsRecorder(options?: {
    filter?: (action: RecordedAction) => boolean;  // ex: (a)=>a.type.startsWith("OUTBOX/")
    cap?: number;                                  // borne mémoire (ex: 2000)
}) {
    const log: RecordedAction[] = [];
    const filter = options?.filter ?? (() => true);
    const cap = options?.cap ?? 2000;

    const middleware: Middleware = () => (next) => (action:any) => {
        const rec = { type: action.type as string, payload: (action as any).payload };
        if (filter(rec)) {
            log.push(rec);
            if (log.length > cap) log.shift();
        }
        return next(action);
    };

    return {
        middleware,
        getAll: () => [...log],
        getTypes: () => log.map((a) => a.type),
        find: (type: string) => log.find((a) => a.type === type),
        count: (type: string) => log.filter((a) => a.type === type).length,
        clear: () => void log.splice(0, log.length),
    };
}
