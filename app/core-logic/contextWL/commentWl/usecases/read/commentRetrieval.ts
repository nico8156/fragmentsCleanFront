// commentRetrieval.ts
import { createAction } from "@reduxjs/toolkit";
import { CafeId, CommentEntity, ISODate, Op } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import { AppThunkWl } from "@/app/store/reduxStoreWl";

export const commentsRetrievalPending = createAction<{ targetId: CafeId; op: Op }>("COMMENTS/RETRIEVAL_PENDING");

export const commentsRetrieved = createAction<{
    targetId: CafeId;
    op: Op;
    items: CommentEntity[];
    nextCursor?: string;
    prevCursor?: string;
    serverTime?: ISODate;
}>("COMMENTS/RETRIEVED");

export const commentsRetrievalFailed = createAction<{ targetId: CafeId; op: Op; error: string }>(
    "COMMENTS/RETRIEVAL_FAILED",
);

// ✅ NOUVEAU : pour sortir de PENDING après un abort (ou un cancel)
export const commentsRetrievalCancelled = createAction<{ targetId: CafeId; op: Op }>(
    "COMMENTS/RETRIEVAL_CANCELLED",
);

const inflight = new Map<string, AbortController>();
const keyOf = (targetId: string, op: Op) => `${op}:${targetId}`;

export const commentRetrieval =
    ({ targetId, op, cursor, limit = 20 }: { targetId: CafeId; op: Op; cursor: string; limit: number }): AppThunkWl<Promise<void>> =>
        async (dispatch, _, commentGatewayWl) => {
            if (!commentGatewayWl?.comments) {
                dispatch(commentsRetrievalFailed({ targetId, op, error: "comments gateway not configured" }));
                return;
            }

            const key = keyOf(targetId, op);

            // 1) abort précédent pour la même (targetId, op)
            inflight.get(key)?.abort();

            // 2) nouveau controller
            const controller = new AbortController();
            inflight.set(key, controller);

            dispatch(commentsRetrievalPending({ targetId, op }));

            try {
                const res = await commentGatewayWl.comments.list({
                    targetId,
                    cursor,
                    limit,
                    signal: controller.signal,
                    op
                });

                // stale result => ignore
                if (inflight.get(key) !== controller) return;

                dispatch(
                    commentsRetrieved({
                        targetId,
                        op,
                        items: res.items,
                        prevCursor: res.prevCursor,
                        nextCursor: res.nextCursor,
                        serverTime: res.serverTime,
                    }),
                );
            } catch (e: any) {
                // ✅ IMPORTANT : si abort => on remet à IDLE (sinon PENDING forever)
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
