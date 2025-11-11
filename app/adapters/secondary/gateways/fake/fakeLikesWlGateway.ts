import {LikeWlGateway} from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";

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
    }

    setCurrentUserIdGetter(getter: () => string) {
        this.currentUserIdGetter = getter;
    }

    private ensureRecord(targetId: string): LikeRecord {
        let record = this.store.get(targetId);
        if (!record) {
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
        return fallback ?? this.currentUserIdGetter?.() ?? "anonymous";
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

    async get({ targetId, signal }: { targetId: string; signal: AbortSignal }) {
        if (this.willFailGet) throw new Error("likes get failed");
        const record = this.ensureRecord(targetId);
        const override = this.nextGetResponse;
        if (override) {
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
        return {
            count: record.count,
            me: record.likers.has(currentUserId),
            version: record.version,
            serverTime: record.updatedAt,
        };
    }

    async add({ commandId, targetId, userId, at }: { commandId: string; targetId: string; userId: string; at: string }) {
        void commandId;
        if (this.willFailAdd) throw new Error("likes add failed");
        const record = this.ensureRecord(targetId);
        const actor = this.getCurrentUserId(userId);
        record.likers.add(actor);
        record.count = Math.max(record.count + 1, record.likers.size);
        record.version += 1;
        record.updatedAt = at;
    }

    async remove({ commandId, targetId, userId, at }: { commandId: string; targetId: string; userId: string; at: string }) {
        void commandId;
        if (this.willFailRemove) throw new Error("likes remove failed");
        const record = this.ensureRecord(targetId);
        const actor = this.getCurrentUserId(userId);
        record.likers.delete(actor);
        record.count = Math.max(0, record.count - 1);
        record.version += 1;
        record.updatedAt = at;
    }
}

// Petit helper async
export const flush = () => new Promise<void>((r) => setTimeout(r, 0));
