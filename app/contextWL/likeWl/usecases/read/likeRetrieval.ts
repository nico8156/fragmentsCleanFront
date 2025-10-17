// usecases/read/likesRetrieval.ts
import { AppThunkWl } from "@/app/store/reduxStoreWl";

import { TargetId } from "@/app/contextWL/likeWl/typeAction/likeWl.type";
import {likesRetrievalFailed, likesRetrievalPending, likesRetrieved} from "../../typeAction/likeWl.action";

const inflight = new Map<string, AbortController>();

export const likesRetrieval = ({ targetId }: { targetId: TargetId }): AppThunkWl<Promise<void>> =>
    async (dispatch, _get,  likeWlGateway ) => {
        if (!likeWlGateway) {
            dispatch(likesRetrievalFailed({ targetId, error: "likes gateway not configured" }));
            return;
        }
        inflight.get(targetId)?.abort();
        const controller = new AbortController();
        inflight.set(targetId, controller);

        dispatch(likesRetrievalPending({ targetId }));
        try {
            const res = await likeWlGateway.likes?.get({ targetId, signal: controller.signal }); // { count, me, version, serverTime? }
            if (inflight.get(targetId) !== controller) return;
            dispatch(likesRetrieved({ targetId, ...res }));
        } catch (e: any) {
            if (e?.name === "AbortError") return;
            dispatch(likesRetrievalFailed({ targetId, error: String(e?.message ?? e) }));
        } finally {
            if (inflight.get(targetId) === controller) inflight.delete(targetId);
        }
    };
