import { createSelector } from "@reduxjs/toolkit";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import { OutboxRecord, OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {AppStateWl} from "@/app/store/appStateWl";

export const selectOutbox = (s: AppStateWl) => (s as any).outbox ?? (s as any).oState;
export const selectOutboxQueue = (s: AppStateWl) => selectOutbox(s).queue;
export const selectOutboxById  = (s: AppStateWl) => selectOutbox(s).byId;

export const selectNextOutboxRecord = createSelector(selectOutbox, (state): OutboxRecord | undefined => {
    const nextId = state.queue[0];
    return nextId ? state.byId[nextId] : undefined;
});

export const selectOutboxRecordByCommandId = createSelector(
    selectOutbox,
    (_: RootStateWl, commandId: string | undefined) => commandId,
    (state, commandId): OutboxRecord | undefined => {
        if (!commandId) return undefined;
        const recordId = state.byCommandId[commandId];
        return recordId ? state.byId[recordId] : undefined;
    },
);
