import { ulid } from "ulid";
import { SyncEventsGateway, CursorUnknownSyncError } from "@/app/core-logic/contextWL/outboxWl/runtime/eventsGateway";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/runtime/syncEvents";

const minutesAgo = (base: number, minutes: number) => new Date(base - minutes * 60_000).toISOString();

export class FakeEventsGateway implements SyncEventsGateway {
    private readonly timeline: SyncEvent[];
    private readonly knownCursors: Set<string> = new Set();
    private readonly sessionId = `demo-session-${ulid()}`;
    private localCache: SyncEvent[] = [];

    constructor(now: () => number = () => Date.now()) {
        const base = now();
        this.timeline = this.buildTimeline(base);
        this.localCache = this.timeline.slice(0, 2);
        this.timeline.forEach((evt) => this.knownCursors.add(evt.happenedAt));
    }

    private buildTimeline(base: number): SyncEvent[] {
        const events: SyncEvent[] = [];
        const commentCreatedAt = minutesAgo(base, 45);
        const serverCommentId = `srv_${ulid(base - 45 * 60_000)}`;
        events.push({
            id: ulid(base - 45 * 60_000),
            happenedAt: commentCreatedAt,
            type: "comment.createdAck",
            payload: {
                commandId: `cmd_${ulid(base - 45 * 60_000)}`,
                tempId: `tmp_${ulid(base - 45 * 60_000)}`,
                server: {
                    id: serverCommentId,
                    createdAt: commentCreatedAt,
                    version: 1,
                },
            },
        });

        const likeAddedAt = minutesAgo(base, 30);
        events.push({
            id: ulid(base - 30 * 60_000),
            happenedAt: likeAddedAt,
            type: "like.addedAck",
            payload: {
                commandId: `cmd_${ulid(base - 30 * 60_000)}`,
                targetId: "cafe_demo",
                server: {
                    count: 12,
                    me: true,
                    version: 3,
                    updatedAt: likeAddedAt,
                },
            },
        });

        const ticketConfirmedAt = minutesAgo(base, 20);
        events.push({
            id: ulid(base - 20 * 60_000),
            happenedAt: ticketConfirmedAt,
            type: "ticket.confirmedAck",
            payload: {
                commandId: `cmd_${ulid(base - 20 * 60_000)}`,
                ticketId: `tkt_${ulid(base - 20 * 60_000)}`,
                userId: "demo-user",
                server: {
                    status: "CONFIRMED",
                    version: 2,
                    amountCents: 980,
                    currency: "EUR",
                    ticketDate: ticketConfirmedAt,
                    updatedAt: ticketConfirmedAt,
                    merchantName: "Fragments",
                },
            },
        });

        const commentUpdatedAt = minutesAgo(base, 8);
        events.push({
            id: ulid(base - 8 * 60_000),
            happenedAt: commentUpdatedAt,
            type: "comment.updatedAck",
            payload: {
                commandId: `cmd_${ulid(base - 8 * 60_000)}`,
                commentId: serverCommentId,
                server: {
                    editedAt: commentUpdatedAt,
                    version: 2,
                    body: "Edition serveur",
                },
            },
        });

        const likeRemovedAt = minutesAgo(base, 3);
        events.push({
            id: ulid(base - 3 * 60_000),
            happenedAt: likeRemovedAt,
            type: "like.removedAck",
            payload: {
                commandId: `cmd_${ulid(base - 3 * 60_000)}`,
                targetId: "cafe_demo",
                server: {
                    count: 11,
                    me: false,
                    version: 4,
                    updatedAt: likeRemovedAt,
                },
            },
        });

        return events.sort((a, b) => a.happenedAt.localeCompare(b.happenedAt));
    }

    async replayLocal() {
        return { events: [...this.localCache] };
    }

    async syncFull() {
        const cursor = this.timeline.at(-1)?.happenedAt ?? null;
        if (cursor) this.knownCursors.add(cursor);
        this.localCache = [...this.timeline];
        return {
            events: [...this.timeline],
            cursor,
            sessionId: this.sessionId,
        };
    }

    async syncDelta({ cursor }: { cursor: string | null }) {
        if (!cursor) {
            return this.syncFull();
        }
        if (!this.knownCursors.has(cursor)) {
            throw new CursorUnknownSyncError("cursorUnknown");
        }
        const events = this.timeline.filter((event) => event.happenedAt > cursor);
        const nextCursor = events.length ? events.at(-1)!.happenedAt : cursor;
        if (nextCursor) this.knownCursors.add(nextCursor);
        return {
            events,
            cursor: nextCursor,
            sessionId: this.sessionId,
        };
    }
}
