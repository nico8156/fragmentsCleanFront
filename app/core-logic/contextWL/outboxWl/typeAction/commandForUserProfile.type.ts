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
