export type TargetId = string

export type State = { byId: Record<TargetId, LikeState> }

export type LikeState = {
    liked: boolean;
    count?: number;
    pending?: boolean;
    lastUpdateAt?: number;
}

export interface LikeRoot {
    byId: Record<TargetId, LikeState>;
    outbox: LikeCmd[];
}

export type LikeCmd = { type: 'Like.Set'; commandId: CommandId; targetId: string; liked: boolean; attempts: number; error?: string }

export type CommandId = string




