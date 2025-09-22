export type TargetId = string;

export type State = { byId: Record<TargetId, LikeState> };


export type LikeState = {
    liked: boolean;
    count?: number;
    pending?: boolean;     // mutation en vol (optimistic)
    lastUpdateAt?: number; // anti-rebond concurrent
};