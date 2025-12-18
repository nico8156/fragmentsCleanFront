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
            console.log("[SYNC_EVENTS] received", action.payload.map(e => ({
                id: e.id,
                type: e.type,
                happenedAt: e.happenedAt,
            })));
            const events = action.payload;
            if (!events.length) return;

            const meta = deps.metaStorage.getSnapshot();
            const known = new Set(meta.appliedEventIds);
            const sorted = [...events].sort((a, b) => a.happenedAt.localeCompare(b.happenedAt));
            const newlyApplied: string[] = [];

            for (const evt of sorted) {
                if (known.has(evt.id)) {
                    console.log("[SYNC_EVENTS] skip already applied", { id: evt.id, type: evt.type });
                    continue;
                }
                console.log("[SYNC_EVENTS] applying", { id: evt.id, type: evt.type });

                switch (evt.type) {
                    case "like.addedAck":
                        console.log("[SYNC_EVENTS] dispatch onLikeAddedAck");
                        api.dispatch(onLikeAddedAck(evt.payload));
                        break;
                    case "like.removedAck":
                        console.log("[SYNC_EVENTS] dispatch onLikeRemovedAck");
                        api.dispatch(onLikeRemovedAck(evt.payload));
                        break;
                    case "comment.createdAck":
                        console.log("[SYNC_EVENTS] dispatch onCommentCreatedAck");
                        api.dispatch(onCommentCreatedAck(evt.payload));
                        break;
                    case "comment.updatedAck":
                        console.log("[SYNC_EVENTS] dispatch onCommentUpdatedAck");
                        const p: any = evt.payload;

                        api.dispatch(
                            onCommentUpdatedAck({
                                commandId: p.commandId,
                                commentId: p.commentId,
                                server: {
                                    editedAt: p.updatedAt,   // ✅ updatedAt -> editedAt
                                    version: p.version,
                                    body: p.body,            // optionnel, si un jour présent
                                },
                            }),
                        );
                        break;
                    case "comment.deletedAck":
                        console.log("[SYNC_EVENTS] dispatch onCommentDeletedAck");
                        api.dispatch(onCommentDeletedAck(evt.payload));
                        break;
                    case "ticket.confirmedAck":
                        console.log("[SYNC_EVENTS] dispatch onTicketConfirmedAck");
                        api.dispatch(onTicketConfirmedAck(evt.payload));
                        break;
                    case "ticket.rejectedAck":
                        console.log("[SYNC_EVENTS] dispatch onTicketRejectedAck");
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
                console.log("[SYNC_EVENTS] markEventsApplied", newlyApplied.length);
                await deps.metaStorage.markEventsApplied(newlyApplied, MAX_APPLIED_EVENT_IDS);
            }
        },
    });

    return mw.middleware;
};
