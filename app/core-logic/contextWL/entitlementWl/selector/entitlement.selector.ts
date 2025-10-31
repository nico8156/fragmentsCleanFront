import {AppStateWl} from "@/app/store/appStateWl";

export const canLikeSelector = (state: AppStateWl, userId: string) =>
    Boolean(state.entitlement.byUser[userId]?.rights?.includes("LIKE"));

export const canCommentSelector = (state: AppStateWl, userId: string) =>
    Boolean(state.entitlement.byUser[userId]?.rights?.includes("COMMENT"));

export const canSubmitCafeSelector = (state: AppStateWl, userId: string) =>
    Boolean(state.entitlement.byUser[userId]?.rights?.includes("SUBMIT_CAFE"));
