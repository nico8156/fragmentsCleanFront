    import type { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
    import type { ListCommentsResult, Op } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

    type ListArgs = { targetId: string; cursor?: string; limit?: number; signal: AbortSignal; op?: Op };

    export class FakeCommentsWlGateway implements CommentsWlGateway {
        // --- observabilité (assertions)
        listCalls: Array<Omit<ListArgs, "signal"> & { abortedAtCall: boolean }> = [];
        createCalls: Array<{ commandId: string; targetId: string; parentId?: string | null; body: string; tempId?: string }> = [];
        updateCalls: Array<{ commandId: string; commentId: string; body: string; editedAt?: string }> = [];
        deleteCalls: Array<{ commandId: string; commentId: string; deletedAt: string }> = [];

        // --- comportement configurable
        nextListResponse: ListCommentsResult = {
            items: [],
            nextCursor: undefined,
            prevCursor: undefined,
            serverTime: undefined,
        } as any;

        willFailList = false;
        willFailCreate = false;
        willFailUpdate = false;
        willFailDelete = false;

        failMessageList = "comments list failed";
        failMessageCreate = "comments create failed";
        failMessageUpdate = "comments update failed";
        failMessageDelete = "comments delete failed";

        // --- ACK dispatcher (optionnel; no-op si non utilisé)
        private ackDispatch?: (action: unknown) => void;

        setAckDispatcher(dispatch: (action: unknown) => void) {
            this.ackDispatch = dispatch;
        }

        setCurrentUserIdGetter(_fn: () => string) {
            // no-op for tests
        }

        async list(params: ListArgs): Promise<ListCommentsResult> {
            const { targetId, cursor, limit, signal, op } = params;

            this.listCalls.push({
                targetId,
                cursor,
                limit,
                op,
                abortedAtCall: signal.aborted,
            });

            if (signal.aborted) {
                const e: any = new Error("Aborted");
                e.name = "AbortError";
                throw e;
            }

            if (this.willFailList) {
                throw new Error(this.failMessageList);
            }

            return this.nextListResponse;
        }

        async create(args: { commandId: string; targetId: string; parentId?: string | null; body: string; tempId?: string }): Promise<void> {
            this.createCalls.push(args);
            if (this.willFailCreate) throw new Error(this.failMessageCreate);

            // Si tu veux simuler un ACK dans certains tests :
            // this.ackDispatch?.(someAckAction(...));
        }

        async update(args: { commandId: string; commentId: string; body: string; editedAt?: string }): Promise<void> {
            this.updateCalls.push(args);
            if (this.willFailUpdate) throw new Error(this.failMessageUpdate);
        }

        async delete(args: { commandId: string; commentId: string; deletedAt: string }): Promise<void> {
            this.deleteCalls.push(args);
            if (this.willFailDelete) throw new Error(this.failMessageDelete);
        }
    }
