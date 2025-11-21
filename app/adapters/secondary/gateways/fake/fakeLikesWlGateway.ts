import { nanoid } from "@reduxjs/toolkit";
import { LikeWlGateway } from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";
import { SyncEvent } from "@/app/core-logic/contextWL/outboxWl/typeAction/syncEvent.type";
import { syncEventsReceived } from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

const DEFAULT_STALE_DELAY_MS = 80;

type LikeSeed = {
    targetId: string;
    likers: string[];
    updatedAt: string;
};

type LikeRecord = {
    likers: Set<string>;
    count: number;
    version: number;
    updatedAt: string;
};

type AckDispatcher = (action: { type: string; payload?: any }) => void;

const DEFAULT_SEED: LikeSeed[] = [
    {
        targetId: "07dae867-1273-4d0f-b1dd-f206b290626b",
        likers: [
            "anonymous",
            "camille",
            "yanis",
            "louise",
            "lea",
            "olivier",
            "julie",
            "kevin",
            "ines",
            "marc",
        ],
        updatedAt: "2024-03-01T08:00:00.000Z",
    },
    {
        targetId: "2d6a1ddf-da7f-4136-b855-5a993de80c4d",
        likers: [
            "anonymous",
            "sophie",
            "louis",
            "emma",
            "nathan",
            "maria",
            "alexandre",
        ],
        updatedAt: "2024-03-05T12:15:00.000Z",
    },
    {
        targetId: "30a291bb-7c35-44fa-aa57-b1861920b5de",
        likers: [
            "anonymous",
            "anais",
            "paul",
            "marie",
            "lucas",
            "claire",
            "leo",
            "sarah",
            "lou",
            "aline",
            "victor",
            "thomas",
            "lea",
            "noe",
            "zoe",
            "arthur",
        ],
        updatedAt: "2024-03-10T16:30:00.000Z",
    },
];

const createAbortError = () => {
    const error = new Error("Aborted");
    error.name = "AbortError";
    return error;
};

export class FakeLikesGateway implements LikeWlGateway {
    willFailGet = false;
    willFailAdd = false;
    willFailRemove = false;

    private readonly store = new Map<string, LikeRecord>();
    private readonly delayMs: number;

    private currentUserIdGetter?: () => string;
    private ackDispatcher?: AckDispatcher;

    nextGetResponse:
        | { count: number; me: boolean; version: number; serverTime?: string }
        | null = null;

    constructor(seeds: LikeSeed[] = DEFAULT_SEED, options?: { delayMs?: number }) {
        this.delayMs = options?.delayMs ?? DEFAULT_STALE_DELAY_MS;
        seeds.forEach(({ targetId, likers, updatedAt }) => {
            this.store.set(targetId, {
                likers: new Set(likers),
                count: likers.length,
                version: Math.max(1, likers.length),
                updatedAt,
            });
        });

        console.log("[FAKE_LIKES] init with seeds", {
            targets: Array.from(this.store.keys()),
        });
    }

    setCurrentUserIdGetter(getter: () => string) {
        console.log("[FAKE_LIKES] setCurrentUserIdGetter");
        this.currentUserIdGetter = getter;
    }

    setAckDispatcher(dispatcher: AckDispatcher) {
        console.log("[FAKE_LIKES] setAckDispatcher");
        this.ackDispatcher = dispatcher;
    }

    private ensureRecord(targetId: string): LikeRecord {
        let record = this.store.get(targetId);
        if (!record) {
            console.log("[FAKE_LIKES] ensureRecord: init new record for", targetId);
            record = {
                likers: new Set(),
                count: 0,
                version: 1,
                updatedAt: new Date().toISOString(),
            };
            this.store.set(targetId, record);
        }
        return record;
    }

    private getCurrentUserId(fallback?: string) {
        const id = fallback ?? this.currentUserIdGetter?.() ?? "anonymous";
        console.log("[FAKE_LIKES] getCurrentUserId ->", id);
        return id;
    }

    private async simulateDelay(signal?: AbortSignal) {
        if (!this.delayMs) return;
        if (signal?.aborted) throw createAbortError();
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                signal?.removeEventListener("abort", onAbort);
                resolve();
            }, this.delayMs);
            const onAbort = () => {
                clearTimeout(timer);
                reject(createAbortError());
            };
            signal?.addEventListener("abort", onAbort, { once: true });
        });
    }

    private randomAckDelayMs() {
        const delay = 200 + Math.floor(Math.random() * 400); // un peu plus long que le stale, mais pas 4s
        console.log("[FAKE_LIKES] randomAckDelayMs ->", delay);
        return delay;
    }

    private scheduleAddAck(params: {
        commandId: string;
        targetId: string;
        userId: string;
        at: string;
        record: LikeRecord;
    }) {
        const { commandId, targetId, userId, at, record } = params;
        const delay = this.randomAckDelayMs();

        console.log("[FAKE_LIKES] scheduleAddAck", {
            commandId,
            targetId,
            userId,
            at,
            version: record.version,
            count: record.count,
            delay,
        });

        setTimeout(() => {
            if (!this.ackDispatcher) {
                console.log("[FAKE_LIKES] scheduleAddAck: no ackDispatcher, abort");
                return;
            }

            const evt: SyncEvent = {
                id: `evt_like_add_${nanoid()}`,
                happenedAt: parseToISODate(at),
                type: "like.addedAck",
                payload: {
                    commandId,
                    targetId,
                    server: {
                        count: record.count,
                        me: true,
                        version: record.version,
                        updatedAt: parseToISODate(record.updatedAt),
                    },
                },
            };

            console.log("[FAKE_LIKES] scheduleAddAck: dispatch syncEventsReceived(like.addedAck)", {
                eventId: evt.id,
                commandId,
                targetId,
            });

            this.ackDispatcher(syncEventsReceived([evt]));
        }, delay);
    }

    private scheduleRemoveAck(params: {
        commandId: string;
        targetId: string;
        userId: string;
        at: string;
        record: LikeRecord;
    }) {
        const { commandId, targetId, userId, at, record } = params;
        const delay = this.randomAckDelayMs();

        console.log("[FAKE_LIKES] scheduleRemoveAck", {
            commandId,
            targetId,
            userId,
            at,
            version: record.version,
            count: record.count,
            delay,
        });

        setTimeout(() => {
            if (!this.ackDispatcher) {
                console.log("[FAKE_LIKES] scheduleRemoveAck: no ackDispatcher, abort");
                return;
            }

            const evt: SyncEvent = {
                id: `evt_like_remove_${nanoid()}`,
                happenedAt: parseToISODate(at),
                type: "like.removedAck",
                payload: {
                    commandId,
                    targetId,
                    server: {
                        count: record.count,
                        me: false,
                        version: record.version,
                        updatedAt: parseToISODate(record.updatedAt),
                    },
                },
            };

            console.log("[FAKE_LIKES] scheduleRemoveAck: dispatch syncEventsReceived(like.removedAck)", {
                eventId: evt.id,
                commandId,
                targetId,
            });

            this.ackDispatcher(syncEventsReceived([evt]));
        }, delay);
    }

    async get({ targetId, signal }: { targetId: string; signal: AbortSignal }) {
        console.log("[FAKE_LIKES] get", {
            targetId,
            willFailGet: this.willFailGet,
        });

        if (this.willFailGet) {
            console.log("[FAKE_LIKES] get: throwing fake error");
            throw new Error("likes get failed");
        }

        const record = this.ensureRecord(targetId);
        const override = this.nextGetResponse;

        if (override) {
            console.log("[FAKE_LIKES] get: using nextGetResponse override");
            this.nextGetResponse = null;
            record.count = override.count;
            record.version = override.version;
            record.updatedAt = override.serverTime ?? record.updatedAt;
            if (override.me) {
                record.likers.add(this.getCurrentUserId());
            } else {
                record.likers.delete(this.getCurrentUserId());
            }
            return override;
        }

        await this.simulateDelay(signal);

        const currentUserId = this.getCurrentUserId();
        const response = {
            count: record.count,
            me: record.likers.has(currentUserId),
            version: record.version,
            serverTime: record.updatedAt,
        };

        console.log("[FAKE_LIKES] get: returning response", {
            targetId,
            ...response,
        });

        return response;
    }

    async add({
                  commandId,
                  targetId,
                  userId,
                  at,
              }: {
        commandId: string;
        targetId: string;
        userId: string;
        at: string;
    }) {
        console.log("[FAKE_LIKES] add", {
            commandId,
            targetId,
            userId,
            at,
            willFailAdd: this.willFailAdd,
        });

        if (this.willFailAdd) {
            console.log("[FAKE_LIKES] add: throwing fake error");
            throw new Error("likes add failed");
        }

        const record = this.ensureRecord(targetId);
        const actor = this.getCurrentUserId(userId);

        record.likers.add(actor);
        record.count = Math.max(record.count + 1, record.likers.size);
        record.version += 1;
        record.updatedAt = at;

        console.log("[FAKE_LIKES] add: updated local record", {
            targetId,
            count: record.count,
            version: record.version,
            updatedAt: record.updatedAt,
        });

        this.scheduleAddAck({
            commandId,
            targetId,
            userId: actor,
            at,
            record,
        });
    }

    async remove({
                     commandId,
                     targetId,
                     userId,
                     at,
                 }: {
        commandId: string;
        targetId: string;
        userId: string;
        at: string;
    }) {
        console.log("[FAKE_LIKES] remove", {
            commandId,
            targetId,
            userId,
            at,
            willFailRemove: this.willFailRemove,
        });

        if (this.willFailRemove) {
            console.log("[FAKE_LIKES] remove: throwing fake error");
            throw new Error("likes remove failed");
        }

        const record = this.ensureRecord(targetId);
        const actor = this.getCurrentUserId(userId);

        record.likers.delete(actor);
        record.count = Math.max(0, record.count - 1);
        record.version += 1;
        record.updatedAt = at;

        console.log("[FAKE_LIKES] remove: updated local record", {
            targetId,
            count: record.count,
            version: record.version,
            updatedAt: record.updatedAt,
        });

        this.scheduleRemoveAck({
            commandId,
            targetId,
            userId: actor,
            at,
            record,
        });
    }
}

// Petit helper async
export const flush = () => new Promise<void>((r) => setTimeout(r, 0));
