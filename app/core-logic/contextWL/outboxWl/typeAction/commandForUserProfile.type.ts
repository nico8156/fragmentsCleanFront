import { commandKinds, type CommandId, type ISODate } from "./outbox.type";

export type UserProfileUpdateCommand = {
	kind: typeof commandKinds.UserProfileUpdate;
	commandId: CommandId | string;
	displayName: string;
	at: ISODate | string;
};

export type UserProfileUpdateUndo = {
	kind: typeof commandKinds.UserProfileUpdate;
	displayName?: string;
	version: number;
};

export type UserAvatarAttachCommand = { kind: typeof commandKinds.UserAvatarAttach; commandId: string; mediaId: string; image: { localUri: string; contentType: "image/jpeg" | "image/png"; size: number }; at: string };
export type UserAvatarRemoveCommand = { kind: typeof commandKinds.UserAvatarRemove; commandId: string; at: string };
export type UserAvatarUndo = { kind: typeof commandKinds.UserAvatarAttach | typeof commandKinds.UserAvatarRemove; avatarUrl?: string; version: number };
