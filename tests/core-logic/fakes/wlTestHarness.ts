import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl, Helpers } from "@/app/store/appStateWl";
import type { CommandId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

export const flush = () => new Promise<void>((r) => setTimeout(r, 0));

export const makeFixedHelpers = (p?: {
    nowIso?: string;
    userId?: string;
    profile?: { displayName?: string; avatarUrl?: string } | null;
    commandIds?: string[];
}): Helpers => {
    const nowIso = p?.nowIso ?? "2025-10-10T07:03:00.000Z";
    const userId = p?.userId ?? "user_test";
    const profile = p?.profile ?? null;

    let i = 0;
    const commandIds = p?.commandIds ?? ["cmd_test_001", "cmd_test_002", "cmd_test_003"];

    return {
        nowIso: () => nowIso,
        currentUserId: () => userId,
        currentUserProfile: () => profile,
        newCommandId: () => (commandIds[Math.min(i++, commandIds.length - 1)] as unknown as CommandId),

        // HelpersTest
        getCommentIdForTests: () => "cmt_test_001",
        getCommandIdForTests: () => "cmd_test_forced",
        newTicketIdForTests: () => ("2025-10-10T07:00:00.000Z" as any),
    };
};

export const makeStoreWl = (p: {
    deps: DependenciesWl;
    listeners: any[];
}): ReduxStoreWl => {
    return initReduxStoreWl({
        dependencies: p.deps,
        listeners: p.listeners,
    });
};
