import type { LikeWlGateway } from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";

export class FakeLikesGateway implements LikeWlGateway {
    addCalls: Array<{ commandId: string; targetId: string; at: string }> = [];
    removeCalls: Array<{ commandId: string; targetId: string; at: string }> = [];
    getCalls: Array<{ targetId: string }> = [];

    nextGetResponse: { count: number; me: boolean; version: number; serverTime?: string } = {
        count: 0,
        me: false,
        version: 0,
        serverTime: undefined,
    };

    willFailGet = false;
    failMessage = "likes get failed";

    private serverByTarget: Record<
        string,
        { count: number; me: boolean; version: number; serverTime?: string }
    > = {};

    seed(targetId: string, v: { count: number; me: boolean; version: number; serverTime?: string }) {
        this.serverByTarget[targetId] = v;
    }

    async get({ targetId, signal }: { targetId: string; signal: AbortSignal }) {
        this.getCalls.push({ targetId });

        if (signal.aborted) {
            const e: any = new Error("Aborted");
            e.name = "AbortError";
            throw e;
        }

        if (this.willFailGet) {
            throw new Error(this.failMessage);
        }

        return this.nextGetResponse;
    }


    async add({ commandId, targetId, at }: { commandId: string; targetId: string; at: string }) {
        this.addCalls.push({ commandId, targetId, at });
    }

    async remove({ commandId, targetId, at }: { commandId: string; targetId: string; at: string }) {
        this.removeCalls.push({ commandId, targetId, at });
    }
}
