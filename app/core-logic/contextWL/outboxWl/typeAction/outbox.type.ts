import {
	CommentCreateCommand, CommentCreateUndo,
	CommentDeleteCommand, CommentDeleteUndo,
	CommentUpdateCommand, CommentUpdateUndo
	, CommentReportCommand, CommentReportUndo, UserBlockCommand, UserBlockUndo
} from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForComment.type";
import {
	LikeAddCommand,
	LikeAddUndo,
	LikeRemoveCommand,
	LikeRemoveUndo
} from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForLike.type";
import { TicketVerifyCommand, TicketVerifyUndo } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForTicket.type";
import { SavedCoffeeSetCommand, SavedCoffeeSetUndo } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForSavedCoffee.type";
import { UserAvatarAttachCommand, UserAvatarRemoveCommand, UserAvatarUndo, UserProfileUpdateCommand, UserProfileUpdateUndo } from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForUserProfile.type";
import type { ExperienceCreateCommand, ExperienceDeleteCommand, ExperienceMediaAttachCommand, ExperienceMediaDeleteCommand, ExperiencePublishCommand, ExperienceReportCommand, ExperienceUndo, ExperienceUpdateCommand } from "./commandForExperience.type";

export type ISODate = string & { readonly __brand: "ISODate" };
export type CommandId = string & { readonly __brand: "CommandId" };
export const parseToCommandId = (commandId: string): CommandId => commandId as CommandId;

export const commandKinds = {
	CommentCreate: "Comment.Create",
	CommentUpdate: "Comment.Update",
	CommentDelete: "Comment.Delete",
	CommentRetrieve: "Comment.Retrieve",
	CommentReport: "Comment.Report",
	UserBlockSet: "User.Block.Set",
	LikeAdd: "Like.Add",
	LikeRemove: "Like.Remove",
	SavedCoffeeSet: "SavedCoffee.Set",
	TicketVerify: "Ticket.Verify",
	UserProfileUpdate: "User.Profile.Update",
	ExperienceCreate: "Experience.Create",
	ExperienceUpdate: "Experience.Update",
	ExperiencePublish: "Experience.Publish",
	ExperienceDelete: "Experience.Delete",
	ExperienceReport: "Experience.Report",
	ExperienceMediaAttach: "Experience.Media.Attach",
	ExperienceMediaDelete: "Experience.Media.Delete",
	UserAvatarAttach: "User.Avatar.Attach",
	UserAvatarRemove: "User.Avatar.Remove",
} as const;

export type CommandKind = typeof commandKinds[keyof typeof commandKinds];

export const statusTypes = {
	queued: "queued",
	processing: "processing",
	succeeded: "succeeded",
	failed: "failed",
	awaitingAck: "awaitingAck",
} as const;

export type StatusType = typeof statusTypes[keyof typeof statusTypes];

export type OutboxItem = {
	command: OutboxCommand;
	undo: OutboxUndo;
};

// ===== Unions =====
export type OutboxCommand =
	| LikeAddCommand
	| LikeRemoveCommand
	| CommentCreateCommand
	| CommentUpdateCommand
	| CommentDeleteCommand
	| CommentReportCommand
	| UserBlockCommand
	| SavedCoffeeSetCommand
	| TicketVerifyCommand
	| UserProfileUpdateCommand
	| ExperienceCreateCommand
	| ExperienceUpdateCommand
	| ExperiencePublishCommand
	| ExperienceDeleteCommand
	| ExperienceReportCommand
	| ExperienceMediaAttachCommand
	| ExperienceMediaDeleteCommand
	| UserAvatarAttachCommand
	| UserAvatarRemoveCommand;

export type OutboxUndo =
	| LikeAddUndo
	| LikeRemoveUndo
	| CommentCreateUndo
	| CommentUpdateUndo
	| CommentDeleteUndo
	| CommentReportUndo
	| UserBlockUndo
	| SavedCoffeeSetUndo
	| TicketVerifyUndo
	| UserProfileUpdateUndo
	| UserAvatarUndo
	| ExperienceUndo;

export type OutboxRecord = {
	id: string;
	item: OutboxItem;
	status: StatusType;
	attempts: number;
	lastError?: string;

	// keep stable snapshot fields
	enqueuedAt: string;         // ISO string
	nextCheckAt?: string;       // ISO string (awaitingAck deadline)
	nextAttemptAt?: number;     // ms epoch (retry scheduler)
};

export type OutboxStateWl = {
	byId: Record<string, OutboxRecord>;
	queue: string[];
	byCommandId: Record<string, string>;
	suspended: boolean;
};
