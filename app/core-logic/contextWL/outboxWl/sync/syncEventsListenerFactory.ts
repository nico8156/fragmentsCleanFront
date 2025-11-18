import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

import { syncEventsReceived } from "../typeAction/sync.action";

import {
    onLikeAddedAck,
    onLikeRemovedAck,
} from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import {
    onCommentCreatedAck,
    onCommentUpdatedAck,
    onCommentDeletedAck,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import {
    onTicketConfirmedAck,
    onTicketRejectedAck,
} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import {SyncMetaStorage} from "@/app/core-logic/contextWL/outboxWl/typeAction/syncMeta.types";

const MAX_APPLIED_EVENT_IDS = 2000;

type Deps = {
    metaStorage: SyncMetaStorage;
};

export const syncEventsListenerFactory = (deps: Deps) => {
    const mw = createListenerMiddleware();
    const startListening = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

    startListening({
        actionCreator: syncEventsReceived,
        effect: async (action, api) => {
            const events = action.payload;
            if (!events.length) return;

            const meta = deps.metaStorage.getSnapshot();
            const known = new Set(meta.appliedEventIds);
            const sorted = [...events].sort((a, b) => a.happenedAt.localeCompare(b.happenedAt));
            const newlyApplied: string[] = [];

            for (const evt of sorted) {
                if (known.has(evt.id)) continue;

                switch (evt.type) {
                    case "like.addedAck":
                        api.dispatch(onLikeAddedAck(evt.payload));
                        break;
                    case "like.removedAck":
                        api.dispatch(onLikeRemovedAck(evt.payload));
                        break;
                    case "comment.createdAck":
                        api.dispatch(onCommentCreatedAck(evt.payload));
                        break;
                    case "comment.updatedAck":
                        api.dispatch(onCommentUpdatedAck(evt.payload));
                        break;
                    case "comment.deletedAck":
                        api.dispatch(onCommentDeletedAck(evt.payload));
                        break;
                    case "ticket.confirmedAck":
                        api.dispatch(onTicketConfirmedAck(evt.payload));
                        break;
                    case "ticket.rejectedAck":
                        api.dispatch(onTicketRejectedAck(evt.payload));
                        break;
                    default:
                        console.warn("[sync] unknown event type", evt);
                        break;
                }

                known.add(evt.id);
                newlyApplied.push(evt.id);
            }

            if (newlyApplied.length) {
                await deps.metaStorage.markEventsApplied(newlyApplied, MAX_APPLIED_EVENT_IDS);
            }
        },
    });

    return mw.middleware;
};
