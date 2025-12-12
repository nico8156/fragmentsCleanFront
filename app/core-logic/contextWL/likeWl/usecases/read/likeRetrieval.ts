// usecases/read/likesRetrieval.ts
import { AppThunkWl } from "@/app/store/reduxStoreWl";
import { TargetId } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import {
    likesRetrievalFailed,
    likesRetrievalPending,
    likesRetrieved,
} from "../../typeAction/likeWl.action";

const inflight = new Map<string, AbortController>();

export const likesRetrieval = ({ targetId }: { targetId: TargetId }): AppThunkWl<Promise<void>> =>
    async (dispatch, _get, gateways) => {
        if (!gateways) {
            dispatch(
                likesRetrievalFailed({
                    targetId,
                    error: "likes gateway not configured",
                }),
            );
            return;
        }

        const likeGateway = gateways.likes;
        if (!likeGateway) {
            dispatch(
                likesRetrievalFailed({
                    targetId,
                    error: "likes gateway not configured",
                }),
            );
            return;
        }

        inflight.get(targetId)?.abort();
        const controller = new AbortController();
        inflight.set(targetId, controller);

        dispatch(likesRetrievalPending({ targetId }));

        try {
            console.log("[LIKES] calling gateway.get for targetId=", targetId);

            const res = await likeGateway.get({ targetId, signal: controller.signal });

            if (inflight.get(targetId) !== controller) return;

            dispatch(
                likesRetrieved({
                    targetId,
                    count: res.count,
                    me: res.me,
                    version: res.version,
                    serverTime: res.serverTime,
                }),
            );
        } catch (e: any) {
            if (e?.name === "AbortError") return;

            dispatch(
                likesRetrievalFailed({
                    targetId,
                    error: String(e?.message ?? e),
                }),
            );
        } finally {
            if (inflight.get(targetId) === controller) {
                inflight.delete(targetId);
            }
        }
    };
