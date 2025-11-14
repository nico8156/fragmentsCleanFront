import { createSelector } from "@reduxjs/toolkit";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import { OutboxRecord, OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const selectOutboxState = (state: RootStateWl): OutboxStateWl => state.oState;

export const selectOutboxQueue = createSelector(selectOutboxState, (state) => state.queue);

export const selectNextOutboxRecord = createSelector(selectOutboxState, (state): OutboxRecord | undefined => {
    const nextId = state.queue[0];
    return nextId ? state.byId[nextId] : undefined;
});

export const selectOutboxRecordByCommandId = createSelector(
    selectOutboxState,
    (_: RootStateWl, commandId: string | undefined) => commandId,
    (state, commandId): OutboxRecord | undefined => {
        if (!commandId) return undefined;
        const recordId = state.byCommandId[commandId];
        return recordId ? state.byId[recordId] : undefined;
    },
);
