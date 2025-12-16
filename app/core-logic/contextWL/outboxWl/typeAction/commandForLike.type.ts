import {CommandId, commandKinds, ISODate} from "./outbox.type";

// ===== Likes =====
export type LikeAddCommand = {
    kind: typeof commandKinds.LikeAdd;
    commandId: CommandId | string;            // idempotence côté serveur
    targetId: string;
    at: ISODate | string;
};
export type LikeAddUndo = {
    kind: typeof commandKinds.LikeAdd;
    targetId: string;
    prevCount: number;
    prevMe: boolean;
    prevVersion?: number;
};

export type LikeRemoveCommand = {
    kind: typeof commandKinds.LikeRemove;
    commandId: CommandId | string;
    targetId: string;
    at: ISODate | string;
};
export type LikeRemoveUndo = {
    kind: typeof commandKinds.LikeRemove;
    targetId: string;
    prevCount: number;
    prevMe: boolean;
    prevVersion?: number;
};
