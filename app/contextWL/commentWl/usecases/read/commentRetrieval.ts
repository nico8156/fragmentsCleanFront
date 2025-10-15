import {createAction} from "@reduxjs/toolkit";
import {CafeId, CommentEntity, ISODate, Op} from "@/app/contextWL/commentWl/type/commentWl.type";
import {AppThunkWl} from "@/app/store/reduxStoreWl";

export const commentsRetrievalPending = createAction<{ targetId: CafeId; op: Op }>("COMMENTS/RETRIEVAL_PENDING");

export const commentsRetrieved = createAction<{
    targetId: CafeId;
    op: Op;
    items: CommentEntity[];
    nextCursor?: string;
    prevCursor?: string;
    serverTime?: ISODate; // watermark from server
}>("COMMENTS/RETRIEVED");

export const commentsRetrievalFailed = createAction<{ targetId: CafeId; op: Op; error: string }>(
    "COMMENTS/RETRIEVAL_FAILED"
);

const inflight = new Map<string, AbortController>();
const keyOf = (targetId: string, op: Op) => `${op}:${targetId}`;

export const commentRetrieval = ({ targetId, op, cursor, limit=20 }:{ targetId: CafeId; op: Op; cursor: string; limit: number }) : AppThunkWl<Promise<void>> =>
    async (dispatch, _, commentGatewayWl) => {
        if (!commentGatewayWl?.comments) {
            dispatch(commentsRetrievalFailed({ targetId, op, error: "comments gateway not configured" }));
            return;
        }
        // 1) Annule la requête précédente pour (targetId, op)
        const key = keyOf(targetId, op);
        inflight.get(key)?.abort();

        // 2) Nouveau controller
        const controller = new AbortController();
        inflight.set(key, controller);

        dispatch(commentsRetrievalPending({targetId,op}))

        try {
            //TODO verify good use of limit and cursor
            const res = await commentGatewayWl.comments.list({ targetId, cursor, limit, signal: controller.signal });
            // si quelqu’un a relancé entre-temps, ignore ce résultat
            if (inflight.get(key) !== controller) return;

            if (res) {

                dispatch(commentsRetrieved({
                    targetId: targetId,
                    op,
                    items: res.items,
                    prevCursor: res.prevCursor,
                    nextCursor: res.nextCursor,
                    serverTime: res.serverTime, // watermark
                }));
            } else {
                dispatch(commentsRetrievalFailed({ targetId, op, error: "Failed to retrieve comments" }));
            }
        } catch (e:any) {
            if (e?.name === "AbortError") return; // evite erreur cote UI
            dispatch(commentsRetrievalFailed({ targetId: targetId, op, error: String(e?.message ?? e) }));
        } finally {
           //nettoyage
            if (inflight.get(key) === controller) inflight.delete(key);
        }
    }
