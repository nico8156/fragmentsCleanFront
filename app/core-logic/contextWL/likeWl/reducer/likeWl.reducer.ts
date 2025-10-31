
import {createReducer} from "@reduxjs/toolkit";
import {
    likeOptimisticApplied,
    likeReconciled, likeRollback,
    likesRetrievalFailed,
    likesRetrievalPending,
    likesRetrieved,
    unlikeOptimisticApplied
} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";

import {AppStateWl} from "@/app/store/appStateWl";
import {LikeAggregate, LikesStateWl, loadingStates, TargetId} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import {ISODate} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";

const initialState: AppStateWl["likes"] = { byTarget: {} };

const ensureAgg = (state: LikesStateWl, targetId: TargetId): LikeAggregate & { loading: any; error?: string } =>
    (state.byTarget[targetId] ??= { targetId, count: 0, me: false, version: 0, loading: "idle" });

export const likeWlReducer = createReducer(
    initialState,
    (builder) => {
        builder.addCase(likesRetrievalPending, (state, { payload: { targetId } }) => {
            const v = ensureAgg(state, targetId);
            v.loading = loadingStates.PENDING;
            v.error = undefined;
        });
        builder.addCase(likesRetrieved, (state, { payload: { targetId, count, me, version, serverTime } }) => {
            const v = ensureAgg(state, targetId);
            v.count = count;
            v.me = me;
            v.version = version;
            v.updatedAt = serverTime as ISODate?? v.updatedAt as ISODate;
            v.loading = loadingStates.SUCCESS;
            v.optimistic = false;
        });
        builder.addCase(likesRetrievalFailed, (state, { payload: { targetId, error } }) => {
            const v = ensureAgg(state, targetId);
            v.loading = loadingStates.ERROR;
            v.error = error;
        });

        // WRITE optimistic
        builder.addCase(likeOptimisticApplied, (state, { payload: { targetId } }) => {
            const v = ensureAgg(state, targetId);
            if (!v.me) {
                v.count = Math.max(0, v.count + 1);
                v.me = true;
                v.optimistic = true;
            }
        });
        builder.addCase(unlikeOptimisticApplied, (state, { payload: { targetId } }) => {
            const v = ensureAgg(state, targetId);
            if (v.me) {
                v.count = Math.max(0, v.count - 1);
                v.me = false;
                v.optimistic = true;
            }
        });

        // RECONCILE
        builder.addCase(likeReconciled, (state, { payload: { targetId, server } }) => {
            const v = ensureAgg(state, targetId);
            v.count = server.count;
            v.me = server.me;
            v.version = server.version;
            v.updatedAt = server.updatedAt ?? v.updatedAt;
            v.optimistic = false;
            v.loading = v.loading === loadingStates.PENDING ? loadingStates.SUCCESS : v.loading;
        });

        // ROLLBACK
        builder.addCase(likeRollback, (state, { payload: { targetId, prevCount, prevMe, prevVersion } }) => {
            const v = ensureAgg(state, targetId);
            v.count = prevCount;
            v.me = prevMe;
            v.version = prevVersion ?? v.version;
            v.optimistic = false;
            // ne change pas loading ici
        });
    }
)