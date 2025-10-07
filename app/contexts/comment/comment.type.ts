// Identifiants
import {CommentsState} from "@/app/store/appState";

export type CommentId = string;        // serverId
export type TempId = string;           // uuid v4 local

// Domain
export const CommentStatuss = {
    CommentVisible : "visible",
    CommentDeleted : "deleted"
} as const;// côté serveur
// export const CommandTypes = { CommentCreate: "Comment.Create", LikeSet: "Like.Set" } as const;
// export type CommandType = typeof CommandTypes[keyof typeof CommandTypes];
export const LocalSyncStates = {
    Idle: "idle",
    Pending: "pending",
    Sent: "sent",
    Failed: "failed"
}
export type LocalSyncState = typeof LocalSyncStates[keyof typeof LocalSyncStates];
export type CommentStatus = typeof CommentStatuss[keyof typeof CommentStatuss];

export interface CommentRoot {
    comments: CommentsState;
    outbox: OutboxState;
}


export interface OutboxState {
    queue: OutboxCommand[];
    isSuspended: boolean;
}

export interface Comment {
    id?: CommentId;              // absent tant que non confirmé
    tempId?: TempId;             // présent tant que non confirmé
    postId: string;              // ou ticketId / entityId selon ton domaine
    authorId: string;
    body: string;
    createdAt: string;           // ISO
    updatedAt: string;           // ISO
    status: CommentStatus;       // "visible" | "deleted"
    // Client-only
    _local: {
        sync: LocalSyncState;
        lastError?: string;
        version: number;           // pour résolutions d’édition locales
    };
}

type CommandBase = {
    commandId: string;          // idempotence
    createdAt: string;
    attempt: number;
};

export const CommentCommandTypes = {
    CommentCreate: "Comment.Create",
    CommentEdit: "Comment.Edit",
    CommentDelete: "Comment.Delete",
    CommentRetrieve: "Comment.Retrieve"
} as const

export type CommentCommandType = typeof CommentCommandTypes[keyof typeof CommentCommandTypes];

export type CommentCreateCmd = CommandBase & {
    type: CommentCommandType;
    tempId: TempId;
    postId: string;
    body: string;
    draftId?: string;           // si tu unifies l'idempotence par "draftId"
};

export type CommentEditCmd = CommandBase & {
    type: "Comment.Edit";
    commentId?: CommentId;      // si déjà connu
    tempId?: TempId;            // sinon, tant que non mappé
    body: string;
};

export type CommentDeleteCmd = CommandBase & {
    type: "Comment.Delete";
    commentId?: CommentId;
    tempId?: TempId;
    reason?: "user" | "moderation";
};

export type CommentRetrieveJob = CommandBase & {
    type: "Comment.Retrieve";
    postId: string;
    cursor?: string;            // pagination / delta token
    direction?: "initial" | "since" | "older" | "newer";
};

export type OutboxCommand =
    | CommentCreateCmd
    | CommentEditCmd
    | CommentDeleteCmd
    | CommentRetrieveJob
    | /* existants */ any;
