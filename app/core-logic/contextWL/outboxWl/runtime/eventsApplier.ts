import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/runtime/syncEvents";
import { SyncMetaStorage } from "@/app/core-logic/contextWL/outboxWl/runtime/syncMetaStorage";
import { onLikeAddedAck, onLikeRemovedAck } from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import {
    onCommentCreatedAck,
    onCommentUpdatedAck,
    onCommentDeletedAck,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import {
    onTicketConfirmedAck,
    onTicketRejectedAck,
} from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";

const MAX_APPLIED_EVENT_IDS = 2000;

export const createEventsApplier = (dispatch: AppDispatchWl, metaStorage: SyncMetaStorage) => {
    const apply = async (events: SyncEvent[]) => {
        if (!events.length) return;
        const meta = metaStorage.getSnapshot();
        const knownIds = new Set(meta.appliedEventIds);
        const sorted = [...events].sort((a, b) => a.happenedAt.localeCompare(b.happenedAt));
        const newlyApplied: string[] = [];

        for (const event of sorted) {
            if (knownIds.has(event.id)) continue;
            switch (event.type) {
                case "like.addedAck":
                    dispatch(onLikeAddedAck(event.payload));
                    break;
                case "like.removedAck":
                    dispatch(onLikeRemovedAck(event.payload));
                    break;
                case "comment.createdAck":
                    dispatch(onCommentCreatedAck(event.payload));
                    break;
                case "comment.updatedAck":
                    dispatch(onCommentUpdatedAck(event.payload));
                    break;
                case "comment.deletedAck":
                    dispatch(onCommentDeletedAck(event.payload));
                    break;
                case "ticket.confirmedAck":
                    dispatch(onTicketConfirmedAck(event.payload));
                    break;
                case "ticket.rejectedAck":
                    dispatch(onTicketRejectedAck(event.payload));
                    break;
                default:
                    console.warn("[runtime] unknown sync event", event);
                    break;
            }
            knownIds.add(event.id);
            newlyApplied.push(event.id);
        }

        if (newlyApplied.length === 0) return;
        await metaStorage.markEventsApplied(newlyApplied, MAX_APPLIED_EVENT_IDS);
    };

    return apply;
};
