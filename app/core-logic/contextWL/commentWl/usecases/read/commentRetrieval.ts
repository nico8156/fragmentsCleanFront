// commentRetrieval.ts
import { createAction } from "@reduxjs/toolkit";
import type { AppThunkWl } from "@/app/store/reduxStoreWl";
import type { CafeId, CommentEntity, ISODate, Op } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";

export const commentsRetrievalPending = createAction<{ targetId: CafeId; op: Op }>(
    "COMMENTS/RETRIEVAL_PENDING",
);

export const commentsRetrieved = createAction<{
    targetId: CafeId;
    op: Op;
    items: CommentEntity[];
    nextCursor?: string | null;
    prevCursor?: string | null;
    serverTime?: ISODate;
}>("COMMENTS/RETRIEVED");

export const commentsRetrievalFailed = createAction<{ targetId: CafeId; op: Op; error: string }>(
    "COMMENTS/RETRIEVAL_FAILED",
);

export const commentsRetrievalCancelled = createAction<{ targetId: CafeId; op: Op }>(
    "COMMENTS/RETRIEVAL_CANCELLED",
);

const inflight = new Map<string, AbortController>();
const keyOf = (targetId: string, op: Op) => `${op}:${targetId}`;

export const commentRetrieval =
    ({
         targetId,
         op,
         cursor,
         limit = 20,
     }: {
        targetId: CafeId;
        op: Op;
        cursor?: string | null;
        limit?: number;
    }): AppThunkWl<Promise<void>> =>
        async (dispatch, _getState, gateways) => {
            if (!gateways?.comments) {
                dispatch(commentsRetrievalFailed({ targetId, op, error: "comments gateway not configured" }));
                return;
            }

            const key = keyOf(targetId, op);

            inflight.get(key)?.abort();
            const controller = new AbortController();
            inflight.set(key, controller);

            dispatch(commentsRetrievalPending({ targetId, op }));

            try {
                const res = await gateways.comments.list({
                    targetId,
                    cursor: cursor ?? undefined,
                    limit,
                    signal: controller.signal,
                    op,
                });

                // stale result => ignore
                if (inflight.get(key) !== controller) return;

                dispatch(
                    commentsRetrieved({
                        targetId,
                        op,
                        items: res.items,
                        nextCursor: res.nextCursor ?? null,
                        prevCursor: res.prevCursor ?? null,
                        serverTime: res.serverTime,
                    }),
                );
            } catch (e: any) {
                if (e?.name === "AbortError") {
                    if (inflight.get(key) === controller) {
                        dispatch(commentsRetrievalCancelled({ targetId, op }));
                    }
                    return;
                }
                dispatch(commentsRetrievalFailed({ targetId, op, error: String(e?.message ?? e) }));
            } finally {
                if (inflight.get(key) === controller) inflight.delete(key);
            }
        };
