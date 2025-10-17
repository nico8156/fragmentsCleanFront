// testUtils/fakeLikesGateway.ts
export class FakeLikesGateway {
    willFailGet = false;
    willFailAdd = false;
    willFailRemove = false;

    nextGetResponse:
        | { count: number; me: boolean; version: number; serverTime?: string }
        | null = null;

    async get({ targetId }: { targetId: string }) {
        if (this.willFailGet) throw new Error("likes get failed");
        return (
            this.nextGetResponse ?? {
                count: 0,
                me: false,
                version: 1,
                serverTime: "2025-10-10T07:00:00.000Z",
            }
        );
    }

    async add(_: { commandId: string; targetId: string; at: string }) {
        if (this.willFailAdd) throw new Error("likes add failed");
        return Promise.resolve();
    }

    async remove(_: { commandId: string; targetId: string; at: string }) {
        if (this.willFailRemove) throw new Error("likes remove failed");
    }
}

// Petit helper async
export const flush = () => new Promise<void>((r) => setTimeout(r, 0));
