import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {enqueueCommited} from "@/app/contextWL/commentWl/cc";
import {statusTypes} from "@/app/contextWL/outboxWl/outbox.type";

const initialState:AppStateWl["outbox"] = {
    byId: {},
    queue: [],
    byCommandId: {},
}

export const outboxWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(enqueueCommited,(state, action) =>{
                const { id, item, enqueuedAt } = action.payload;
                const cmdId = item.command.commandId;
                // dédup idempotente
                if (state.byCommandId[cmdId]) return;
                state.byId[id] = {
                    id,
                    item,
                    status: statusTypes.queued,
                    attempts: 0,
                    enqueuedAt,
                };
                state.queue.push(id);
                state.byCommandId[cmdId] = id;
            })
    }
)