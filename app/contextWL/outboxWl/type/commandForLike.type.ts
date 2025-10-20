import {CommandId, commandKinds, ISODate} from "./outbox.type";

// ===== Likes =====
export type LikeAddCommand = {
    kind: typeof commandKinds.LikeAdd;
    commandId: CommandId;            // idempotence côté serveur
    targetId: string;                // ex: cafeId
    at: ISODate;
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
    commandId: CommandId;
    targetId: string;
    at: ISODate;
};
export type LikeRemoveUndo = {
    kind: typeof commandKinds.LikeRemove;
    targetId: string;
    prevCount: number;
    prevMe: boolean;
    prevVersion?: number;
};
