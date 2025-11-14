import { ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
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

export type LikeAddedAckPayload = ReturnType<typeof onLikeAddedAck>["payload"];
export type LikeRemovedAckPayload = ReturnType<typeof onLikeRemovedAck>["payload"];
export type CommentCreatedAckPayload = ReturnType<typeof onCommentCreatedAck>["payload"];
export type CommentUpdatedAckPayload = ReturnType<typeof onCommentUpdatedAck>["payload"];
export type CommentDeletedAckPayload = ReturnType<typeof onCommentDeletedAck>["payload"];
export type TicketConfirmedAckPayload = ReturnType<typeof onTicketConfirmedAck>["payload"];
export type TicketRejectedAckPayload = ReturnType<typeof onTicketRejectedAck>["payload"];

export type SyncLikeAddedEvent = {
    id: string;
    happenedAt: ISODate;
    type: "like.addedAck";
    payload: LikeAddedAckPayload;
};

export type SyncLikeRemovedEvent = {
    id: string;
    happenedAt: ISODate;
    type: "like.removedAck";
    payload: LikeRemovedAckPayload;
};

export type SyncCommentCreatedEvent = {
    id: string;
    happenedAt: ISODate;
    type: "comment.createdAck";
    payload: CommentCreatedAckPayload;
};

export type SyncCommentUpdatedEvent = {
    id: string;
    happenedAt: ISODate;
    type: "comment.updatedAck";
    payload: CommentUpdatedAckPayload;
};

export type SyncCommentDeletedEvent = {
    id: string;
    happenedAt: ISODate;
    type: "comment.deletedAck";
    payload: CommentDeletedAckPayload;
};

export type SyncTicketConfirmedEvent = {
    id: string;
    happenedAt: ISODate;
    type: "ticket.confirmedAck";
    payload: TicketConfirmedAckPayload;
};

export type SyncTicketRejectedEvent = {
    id: string;
    happenedAt: ISODate;
    type: "ticket.rejectedAck";
    payload: TicketRejectedAckPayload;
};

export type SyncEvent =
    | SyncLikeAddedEvent
    | SyncLikeRemovedEvent
    | SyncCommentCreatedEvent
    | SyncCommentUpdatedEvent
    | SyncCommentDeletedEvent
    | SyncTicketConfirmedEvent
    | SyncTicketRejectedEvent;

export type SyncEventsBatch = {
    events: SyncEvent[];
};

export type SyncResponse = SyncEventsBatch & {
    cursor: string | null;
    sessionId?: string | null;
};
